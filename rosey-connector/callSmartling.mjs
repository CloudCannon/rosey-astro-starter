import {
  SmartlingApiClientBuilder,
  SmartlingJobsApi,
  SmartlingJobBatchesApi,
  SmartlingFilesApi,
  CreateJobParameters,
  CreateBatchParameters,
  UploadBatchFileParameters,
  FileType,
  DownloadFileParameters,
  RetrievalType,
} from "smartling-api-sdk-nodejs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import YAML from "yaml";
import {
  readJsonFromFile,
  getTranslationFilePath,
  isDirectory,
  readTranslationFile,
  handleConfigPaths,
} from "./helpers/file-helpers.mjs";
import { htmlToMarkdown } from "./helpers/html-to-markdown.mjs";
dotenv.config();

export async function callSmartling(configData) {
  const roseyBaseFilePath = handleConfigPaths(
    configData.rosey_paths.rosey_base_file_path
  );
  const translationFilesDirPath = handleConfigPaths(
    configData.rosey_paths.translations_dir_path
  );
  const incomingTranslationsDir = handleConfigPaths(
    configData.smartling.incoming_translations_dir
  );
  const outgoingTranslationsFilePath = handleConfigPaths(
    configData.smartling.outgoing_translations_file_path
  );
  const locales = configData.locales;
  const userSecret = process.env.DEV_USER_SECRET; // Set this in env variables
  const projectId = configData.smartling.dev_project_id;
  const userId = configData.smartling.dev_user_identifier;
  const smartlingTranslateEnabled = configData.smartling.enabled;
  const authRequestData = {
    userIdentifier: userId,
    userSecret: userSecret,
  };
  const outgoingTranslationFileUri =
    configData.smartling.outgoing_translation_file_uri;
  const pingInterval = configData.smartling.ping_interval;
  const pingMaximum = configData.smartling.ping_maximum;
  const pingsToWaitForAuth = configData.smartling.pings_to_wait_for_auth;

  // One more unnecessary check to check if smarling is enabled (just in case)
  if (!smartlingTranslateEnabled || smartlingTranslateEnabled === "false") {
    console.log("🤖 Smartling translation disabled - skipping API call.");
    return;
  } else {
    console.log("🤖 Smartling translation enabled - continuing with API call.");
  }

  // Create outgoing translations file
  // Before adding a phrase to send away for translation, we check if it
  // Already has a translation in the translation files, and in one of the received Smartling translation files (which should all be the same)

  // We only add things to this file that need to be translated, so if it's empty we can skip call
  await generateOutgoingTranslationFile(
    roseyBaseFilePath,
    translationFilesDirPath,
    locales,
    outgoingTranslationsFilePath,
    incomingTranslationsDir
  );

  // Get the outgoing translation file
  // Check here if the outgoingTranslationFile is empty
  // If that is the case, outgoingTranslationFile is empty - don't proceed with the call
  const outgoingTranslationsFileData = await readJsonFromFile(
    outgoingTranslationsFilePath
  );
  const outgoingTranslationFileDataKeys = Object.keys(
    outgoingTranslationsFileData
  );

  if (outgoingTranslationFileDataKeys.length) {
    console.log(
      `🤖 Detected ${outgoingTranslationFileDataKeys.length} translation keys to send to Smartling - continuing with API call.`
    );
  } else {
    console.log(
      "🤖 Nothing detected to send to Smartling - skipping API call."
    );
    return;
  }

  // Create factory for building API clients.
  const apiBuilder = new SmartlingApiClientBuilder()
    .setBaseSmartlingApiUrl("https://api.smartling.com")
    .authWithUserIdAndUserSecret(userId, userSecret);

  // Instantiate the APIs we'll need.
  const jobsApi = apiBuilder.build(SmartlingJobsApi);
  const batchesApi = apiBuilder.build(SmartlingJobBatchesApi);
  const filesApi = apiBuilder.build(SmartlingFilesApi);

  // Get a token
  const authData = await getSmartlingAuth(
    "https://api.smartling.com/auth-api/v2/authenticate",
    authRequestData
  );

  const authToken = authData.response.data.accessToken;

  // Create job.
  const createJobParams = new CreateJobParameters().setName(
    `Test job name ${Date.now()}`
  );
  const job = await jobsApi.createJob(projectId, createJobParams);

  // Create job batch parameters
  const createBatchParams = new CreateBatchParameters()
    .setTranslationJobUid(job.translationJobUid)
    .setAuthorize(true);

  // Add file URIs to the batch parameters
  createBatchParams.addFileUri(outgoingTranslationFileUri);

  // Create batch
  const batch = await batchesApi.createBatch(projectId, createBatchParams);

  const uploadBatchFileParams = new UploadBatchFileParameters()
    .setFile(outgoingTranslationsFilePath)
    .setFileUri(outgoingTranslationFileUri)
    .setFileType(FileType.JSON)
    .setLocalesToApprove(locales); // Determines which locales Smartling will translate for, needs to be configure on Smartlings end

  await batchesApi.uploadBatchFile(
    projectId,
    batch.batchUid,
    uploadBatchFileParams
  );

  console.log(`🤖 Uploaded file ${outgoingTranslationsFilePath} to Smartling.`);

  // Call Job Status API until translation is completed, or we timeout.

  const jobInfoUrlString = `https://api.smartling.com/jobs-api/v3/projects/${projectId}/jobs/${job.translationJobUid}`;

  // We'll exit after a configured amount of pings, in case something goes wrong - so we don't hang around forever
  let pingCount = 0;

  await new Promise(function (resolve, reject) {
    // Set up an interval to try the Smartling api every x amount of pings until its finished

    // Check the job status every ping
    const checkJobStatus = setInterval(async () => {
      console.log("🤖 Checking translation job status...");

      // Fetch current status of the job
      const smartlingJobData = await fetchSmartlingData(
        jobInfoUrlString,
        authToken
      );
      const jobStatus = smartlingJobData.response.data.jobStatus;

      // Exit if we reach the maximum amount of pings
      if (pingCount >= pingMaximum) {
        console.log(
          `⏰ Timing out Smartling connection after ${pingCount} API calls.`
        );
        clearInterval(checkJobStatus);
      }

      // Increment for each time we check
      pingCount++;
      console.log(
        `🤖 Smartling translation job status API call: ${pingCount}.`
      );

      // Job is completed so download the files and stop checking the status
      switch (jobStatus) {
        case "COMPLETED":
          console.log(`🤖 Translation: ${jobStatus}, downloading files now!`);
          clearInterval(checkJobStatus);

          await downloadSmartlingData(
            filesApi,
            locales,
            projectId,
            outgoingTranslationFileUri,
            incomingTranslationsDir
          );

          resolve();
          break;
        // Checks authorization before proceeding to in progress - can sometimes hang here
        // if there are no new translations from Smartlings POV, but for some reason we've still sent away to translate
        // Good to be able to exit earlier than normal if it hangs around on this, as it will never move to IN_PROGRESS
        case "AWAITING_AUTHORIZATION":
          console.log(
            `🤖 Still ${jobStatus} for translation job, waiting for completion...`
          );
          if (pingCount >= pingsToWaitForAuth) {
            console.log(
              `🤖 Skipping after ${pingCount} API calls. If still 'Awaiting Authorization' by now, there is probably nothing to translate in this job, and we should have already exited this function.`
            );
            clearInterval(checkJobStatus);
          }
          break;
        case "IN_PROGRESS":
          console.log(
            `🏗️ Translation job still ${jobStatus}, waiting and trying again...`
          );
          break;
        // Cancelled on Smartlings end for some reason
        case "CANCELLED":
          console.log(
            `🤖 Translation job ${jobStatus} for some reason. Skipping for now. Go to Smartling dashboard for more details.`
          );
          clearInterval(checkJobStatus);
          break;
      }
    }, pingInterval);
  });

  await writeReceivedTranslationsToTranslationFiles(
    translationFilesDirPath,
    locales,
    incomingTranslationsDir
  );
  return;
}

// Get a token
async function getSmartlingAuth(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error("Error:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Get job progress
async function fetchSmartlingData(url, authToken) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error("Error:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Generate the file we're going to send to Smartling for translating
async function generateOutgoingTranslationFile(
  baseFilePath,
  translationFilesDirPath,
  locales,
  outgoingFilePath,
  incomingTranslationsDir
) {
  // Ensure the incoming smartling files directory exists and read from it
  await fs.promises.mkdir(incomingTranslationsDir, { recursive: true });
  const existingSmartlingTranslationsFiles = await fs.promises.readdir(
    incomingTranslationsDir
  );

  // We need to check all locales in case a locale gets added after the first one
  // If a file exists in there it should have existing smartling translation keys which we can add to check
  // We're not sending away already translated keys
  // If we send away a key we get all the locales back, so we just need to read the first one
  const existingSmartlingTranslations = {};
  // Checking if there are any files in the smartling-translations dir
  if (existingSmartlingTranslationsFiles.length) {
    // Go through each and get the existing data from them stored under each locale
    await Promise.all(
      existingSmartlingTranslationsFiles.map(async (translationFile) => {
        const smartlingTranslationsFilePath = path.join(
          incomingTranslationsDir,
          translationFile
        );
        const smartlingTranslations = await readJsonFromFile(
          smartlingTranslationsFilePath
        );
        const fileLocaleName = translationFile.replace(".json", "");
        existingSmartlingTranslations[fileLocaleName] = Object.keys(
          smartlingTranslations
        );
      })
    );
    // Otherwise just make it an empty obj so we see there is no existing Smartling translations
  } else {
    existingSmartlingTranslations = {};
  }

  // Check if the translation key is a blank string in any of the translation files
  // Which means there's no translation and only then send away for a translation for the key
  // This will prevent manually translated keys (or if Smartling has been disabled, and enabled again)
  // Being sent away for translation
  // For each locale check all translation files to see if a key is missing a translation
  const untranslatedKeysInTranslationFiles = [];
  await Promise.all(
    // Loop through each locale
    locales.map(async (locale) => {
      const translationFilesForLocalePath = path.join(
        translationFilesDirPath,
        locale
      );
      const translationFilesForLocale = await fs.promises.readdir(
        translationFilesForLocalePath,
        { recursive: true }
      );
      // Loop through the translation files in each locale and look for untranslated keys in their translation files
      // If we find any locale has an untranslated key we'll add it to the keys allowed to be sent to Smartling
      // And later we check that they also don't reside in the translations we've already received from Smartling
      for (const translationFileName of translationFilesForLocale) {
        const translationFilePath = getTranslationFilePath(
          locale,
          translationFilesDirPath,
          translationFileName
        );

        // Don't try read a dir
        if (!(await isDirectory(translationFilePath))) {
          const translationFileContents = await readTranslationFile(
            translationFilePath
          );

          const keysOnTranslationPage = Object.keys(translationFileContents);
          // Look for keys on the page without a translation (not incl _inputs or urlTranslation)
          for (const key of keysOnTranslationPage) {
            if (key !== "_inputs" && key !== "urlTranslation") {
              const keyContents = translationFileContents[key];

              if (keyContents.trim() === "") {
                untranslatedKeysInTranslationFiles.push(key);
              }
            }
          }
        }
      }
    })
  );

  // We also still need to check for if a key already has a value in existing incoming Smartling translations
  // - A smartling translation could be deleted in the translations files,
  // - Which would mean if we didn't check existing Smartling translations it would send away again and err (awaitng_auth)

  // Get all the keys in the base.json and check whether we need to translate them
  const inputFileData = await readJsonFromFile(baseFilePath);
  const inputFileKeyData = inputFileData.keys;
  const inputKeys = Object.keys(inputFileKeyData);

  // If we don't already have the translation in any of the locales translations files or Smartling files
  // Add it to the outgoing translations obj to be sent away
  const translationObject = {};

  for (const key of inputKeys) {
    // If key doesn't have a translation in the translation files, look through the Smartling translations for each locale
    if (untranslatedKeysInTranslationFiles.includes(key)) {
      // If there's also no translation been received before for any of the locales,
      // we'll add it to the phrases to send to Smartling
      for (const localeArr of Object.keys(existingSmartlingTranslations)) {
        if (!localeArr.includes(key)) {
          const originalPhrase = inputFileData.keys[key].original;
          translationObject[key] = originalPhrase;
          // TODO: If we break here to stop checking the rest of the locales, will it also break the inputKey loop (undesirable)
        }
      }
    }
  }

  // Write the outgoing keys to go to Smartling
  await fs.promises.writeFile(
    outgoingFilePath,
    JSON.stringify(translationObject)
  );

  console.log(
    `🤖 Wrote ${
      Object.keys(translationObject).length
    } keys to send to Smartling for translation.`
  );
}

// Once Smartling has finished translating, download the files to put into the right place in our project
async function downloadSmartlingData(
  filesApi,
  locales,
  projectId,
  outgoingTranslationFileUri,
  incomingTranslationsDir
) {
  for (const locale of locales) {
    // Get the downloaded translations for each locale
    const downloadFileParams = new DownloadFileParameters().setRetrievalType(
      RetrievalType.PUBLISHED
    );
    const downloadedFileContent = await filesApi.downloadFile(
      projectId,
      outgoingTranslationFileUri,
      locale,
      downloadFileParams
    );
    const downloadedFileData = JSON.parse(downloadedFileContent);

    // Check if the directory exists, if not create it
    await fs.promises.mkdir(incomingTranslationsDir, { recursive: true });

    // Once we receive something back update our existing smartling translations
    const smartlingTranslationsPath = path.join(
      incomingTranslationsDir,
      `${locale}.json`
    );
    const smartlingTranslationsData = await readJsonFromFile(
      smartlingTranslationsPath
    );

    // Loop through our downloaded keys and add to the Smartling translations we've received in the past
    const downloadedFileDataKeys = Object.keys(downloadedFileData);
    downloadedFileDataKeys.forEach((key) => {
      smartlingTranslationsData[key] = downloadedFileData[key];
    });

    // Order Smartling data keys, so they're always in alphanumeric order
    const orderedSmartlingTranslationsData = Object.keys(
      smartlingTranslationsData
    )
      .sort() // Sort the keys alphabetically
      .reduce((obj, key) => {
        obj[key] = smartlingTranslationsData[key]; // Rebuild the object with sorted keys
        return obj;
      }, {});

    console.log(
      `Received ${
        Object.keys(orderedSmartlingTranslationsData).length
      } translated keys from Smartling.`
    );

    // Write the updated translations - existing and new
    await fs.promises.writeFile(
      smartlingTranslationsPath,
      JSON.stringify(orderedSmartlingTranslationsData)
    );
    console.log(`🤖 Downloaded ${smartlingTranslationsPath}.`);
  }
}

async function writeReceivedTranslationsToTranslationFiles(
  translationFilesDirPath,
  locales,
  incomingTranslationsDir
) {
  // Loop through each locale
  for (const locale of locales) {
    const translationPagesUpdatedLogs = {};

    const smartlingFilePath = path.join(
      incomingTranslationsDir,
      `${locale}.json`
    );

    // Get the downloaded Smartling data for that locale
    const incomingSmartlingData = await readJsonFromFile(smartlingFilePath);
    const incomingSmartlingDataKeys = Object.keys(incomingSmartlingData);

    // Find all the yaml translation files for that locale and read each one
    const translationFilesForLocaleDirPath = path.join(
      translationFilesDirPath,
      locale
    );
    const translationFilePaths = await fs.promises.readdir(
      translationFilesForLocaleDirPath,
      { recursive: true }
    );

    // Loop through all the files in the locale
    for (const filePath of translationFilePaths) {
      const fullFilePath = path.join(
        translationFilesForLocaleDirPath,
        filePath
      );

      let translationsUpdatedOnPage = 0;
      // Don't try to read a dir
      if (!(await isDirectory(fullFilePath))) {
        const translationFileContents = await readTranslationFile(fullFilePath);

        // For each one look through it for keys that are included in the downloaded Smartling data
        for (const translationKey of Object.keys(translationFileContents)) {
          if (
            incomingSmartlingDataKeys.includes(translationKey) &&
            // If they're blank (an empty string) in the translation file, overwrite with the Smartling data converted to md
            translationFileContents[translationKey]?.trim() === ""
          ) {
            translationFileContents[translationKey] = await htmlToMarkdown(
              incomingSmartlingData[translationKey]
            );
            // Update this to true to let us know we do need to write the file back
            translationsUpdatedOnPage += 1;
          }
        }

        if (translationsUpdatedOnPage > 0) {
          // Update the logs
          translationPagesUpdatedLogs[filePath] = translationsUpdatedOnPage;
          // Write the translation file back to where we found it with the new data
          await fs.promises.writeFile(
            fullFilePath,
            YAML.stringify(translationFileContents)
          );
        }
      }
    }

    // Work out total updates for the logs for each locale
    const pagesUpdated = Object.keys(translationPagesUpdatedLogs);
    if (pagesUpdated.length) {
      let totalKeysUpdated = 0;
      for (const pageWithUpdates of pagesUpdated) {
        totalKeysUpdated += translationPagesUpdatedLogs[pageWithUpdates];
      }
      console.log(
        `Updated ${locale} pages with ${totalKeysUpdated} keys on ${pagesUpdated.length} pages with translations from Smartling.`
      );
    }
  }
}
