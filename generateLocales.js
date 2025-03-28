import fs from "fs";
import YAML from "yaml";
import markdownit from "markdown-it";
import path from "path";
import { isDirectory, readFileWithFallback } from "./helpers/file-helper.js";
import dotenv from "dotenv";
const md = markdownit();
dotenv.config();

export async function generateLocales(configData) {
  const locales = configData.locales;
  // Loop through locales
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i];

    try {
      await generateLocale(locale, configData);
    } catch (err) {
      console.error(`❌❌ Encountered an error translating ${locale}:`, err);
    }
  }
}

async function generateLocale(locale, configData) {
  const translationsDirPath = configData.rosey_paths.translations_dir_path;
  const localesDirPath = configData.rosey_paths.locales_dir_path;
  const baseFile = await fs.promises.readFile(
    configData.rosey_paths.rosey_base_file_path
  );
  const baseFileData = JSON.parse(baseFile.toString("utf-8")).keys;
  const baseURLsFile = await fs.promises.readFile(
    configData.rosey_paths.rosey_base_urls_file_path
  );
  const baseUrlFileData = JSON.parse(baseURLsFile.toString("utf-8")).keys;

  const localePath = path.join(localesDirPath, `${locale}.json`);
  const localeURLsPath = path.join(localesDirPath, `${locale}.urls.json`);
  const translationsLocalePath = path.join(translationsDirPath, locale);

  // Ensure directories exist
  console.log(`📂📂 ${translationsLocalePath} ensuring directory exists`);
  await fs.promises.mkdir(translationsLocalePath, { recursive: true });

  console.log(`📂📂 ${localesDirPath} ensuring directory exists`);
  await fs.promises.mkdir(localesDirPath, { recursive: true });

  // Get last round's translations
  const oldLocaleData = JSON.parse(
    await readFileWithFallback(localePath, "{}")
  );
  const oldUrlsLocaleData = JSON.parse(
    await readFileWithFallback(localeURLsPath, "{}")
  );

  // Get current translations
  const translationsFiles = await fs.promises.readdir(translationsLocalePath, {
    recursive: true,
  });

  // Loop through each file in the translations directory
  const localeDataEntries = {};
  await Promise.all(
    translationsFiles.map(async (filename) => {
      if (
        await isDirectory(
          getTranslationPath(locale, translationsDirPath, filename)
        )
      ) {
        return;
      }

      const response = await processTranslation(
        locale,
        filename,
        translationsDirPath,
        oldLocaleData,
        oldUrlsLocaleData,
        baseFileData,
        baseUrlFileData
      );

      localeDataEntries[filename] = response;
    })
  );

  let localeData = {};
  let localeUrlsData = {};
  let keysToUpdate = {};

  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const { data, urlData } = localeDataEntries[filename];

      Object.keys(urlData).forEach((key) => {
        localeUrlsData[key] = urlData[key];
      });

      Object.keys(data).forEach((key) => {
        if (!localeData[key] || data[key].isNewTranslation) {
          const isKeyMarkdown = key.slice(0, 10).includes("markdown:");

          localeData[key] = {
            original: data[key].original,
            value:
              isKeyMarkdown && data[key].isNewTranslation
                ? md.render(data[key].value)
                : data[key].value,
          };
        }

        if (data[key].isNewTranslation) {
          keysToUpdate[key] = data[key].value;
        }
      });
    })
  );

  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const translationFilePath = getTranslationPath(
        locale,
        translationsDirPath,
        filename
      );
      const fileContents = await readFileWithFallback(translationFilePath, "");
      const data = YAML.parse(fileContents);

      let updatedKeys = [];
      Object.keys(keysToUpdate).forEach((key) => {
        if (data[key] || data[key] === "") {
          data[key] = keysToUpdate[key];
          updatedKeys = [key];
        }
      });

      if (updatedKeys.length > 0) {
        const yamlString = YAML.stringify(data);
        await fs.promises.writeFile(translationFilePath, yamlString);
        console.log(
          `✅ ${translationFilePath} succesfully updated duplicate keys: ${updatedKeys.join(
            ", "
          )}`
        );
      }
    })
  );

  // Order locales data keys, so they're always in alphanumeric order
  const orderedLocaleData = Object.keys(localeData)
    .sort() // Sort the keys alphabetically
    .reduce((obj, key) => {
      obj[key] = localeData[key]; // Rebuild the object with sorted keys
      return obj;
    }, {});

  // Order locales Url data keys, so they're always in alphanumeric order
  const orderedLocaleUrlData = Object.keys(localeUrlsData)
    .sort() // Sort the keys alphabetically
    .reduce((obj, key) => {
      obj[key] = localeUrlsData[key]; // Rebuild the object with sorted keys
      return obj;
    }, {});

  // Write locales data
  await fs.promises.writeFile(
    localePath,
    JSON.stringify(orderedLocaleData, null, "\t")
  );
  console.log(`✅✅ ${localePath} updated succesfully`);

  // Write locales URL data
  await fs.promises.writeFile(
    localeURLsPath,
    JSON.stringify(orderedLocaleUrlData, null, "\t")
  );
  console.log(`✅✅ ${localeURLsPath} updated succesfully`);
}

function getTranslationPath(locale, translationsDirPath, translationFilename) {
  return path.join(translationsDirPath, locale, translationFilename);
}

function getTranslationHTMLFilename(translationFilename) {
  if (translationFilename === "404.yaml") {
    return "404.html";
  }

  if (translationFilename === "home.yaml") {
    return "index.html";
  }

  return translationFilename.replace(".yaml", "/index.html");
}

function processUrlTranslationKey(
  translationEntry,
  translationHTMLFilename,
  baseUrlFileData,
  oldUrlsLocaleData
) {
  if (!translationEntry) {
    return;
  }

  if (translationEntry !== oldUrlsLocaleData[translationHTMLFilename]?.value) {
    console.log(`Detected a new URL translation: ${translationEntry}`);
    return {
      original: translationHTMLFilename,
      value: translationEntry,
    };
  }

  return {
    original: baseUrlFileData[translationHTMLFilename]?.original,
    value:
      oldUrlsLocaleData[translationHTMLFilename]?.value ||
      baseUrlFileData[translationHTMLFilename]?.original,
  };
}

function processContentTranslationKey(
  keyName,
  translatedString,
  localeData,
  baseFileData,
  oldLocaleData
) {
  // Exit early if it's not a new translation, and use old locales data instead
  if (
    !translatedString ||
    translatedString === oldLocaleData[keyName]?.value ||
    md.render(translatedString) === oldLocaleData[keyName]?.value
  ) {
    return !localeData[keyName]
      ? {
          original: baseFileData[keyName]?.original,
          value:
            oldLocaleData[keyName]?.value || baseFileData[keyName]?.original,
        }
      : localeData[keyName];
  }
  // If its not an old translation, write the value to the locales file
  return {
    original: baseFileData[keyName]?.original,
    value: translatedString,
    isNewTranslation: true,
  };
}

async function processTranslation(
  locale,
  translationFilename,
  translationsDirPath,
  oldLocaleData,
  oldUrlsLocaleData,
  baseFileData,
  baseUrlFileData
) {
  const localeData = {};
  const localeUrlsData = {};
  const translationsPath = getTranslationPath(
    locale,
    translationsDirPath,
    translationFilename
  );
  const bufferFromFile = await fs.promises.readFile(translationsPath);
  const fileContents = bufferFromFile.toString("utf-8");
  if (!fileContents) {
    console.log("No fileContents from filepath: ", translationsPath);
  }
  const data = YAML.parse(fileContents);

  if (!data) {
    console.log("No data from filepath: ", translationsPath);
  }

  const translationHTMLFilename =
    getTranslationHTMLFilename(translationFilename);
  // Check if theres a translation and
  // Add each obj to our locales data, excluding '_inputs' object.
  Object.entries(data).forEach(([keyName, translatedString]) => {
    if (keyName === "_inputs") {
      return;
    }

    // Write entry values to be any translated value that appears in translations files
    // If no value detected, and the locale value is an empty string, write the original to value as a fallback
    if (keyName === "urlTranslation") {
      const newEntry = processUrlTranslationKey(
        translatedString,
        translationHTMLFilename,
        baseUrlFileData,
        oldUrlsLocaleData
      );

      if (newEntry) {
        localeUrlsData[translationHTMLFilename] = newEntry;
      } else if (
        // Provide a fallback if there's no translated URL so the translated URL isn't a blank string
        localeUrlsData[translationHTMLFilename]?.value === "" ||
        localeUrlsData[translationHTMLFilename]?.value === undefined
      ) {
        return {
          original: baseUrlFileData[translationHTMLFilename]?.original,
          value: baseUrlFileData[translationHTMLFilename]?.original,
        };
      }
      // Preserve old URL translation
      return {
        original: baseUrlFileData[translationHTMLFilename]?.original,
        value: baseUrlFileData[translationHTMLFilename]?.value,
      };
    }

    localeData[keyName] = processContentTranslationKey(
      keyName,
      translatedString,
      localeData,
      baseFileData,
      oldLocaleData
    );
  });

  return { data: localeData, urlData: localeUrlsData };
}
