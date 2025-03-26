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
  const baseURLFileData = JSON.parse(baseURLsFile.toString("utf-8")).keys;

  const localePath = path.join(localesDirPath, `${locale}.json`);
  const localeURLsPath = path.join(localesDirPath, `${locale}.urls.json`);
  const translationsLocalePath = path.join(translationsDirPath, locale);

  // Ensure directories exist
  console.log(`📂📂 ${translationsLocalePath} ensuring directory exists`);
  await fs.promises.mkdir(translationsLocalePath, { recursive: true });

  console.log(`📂📂 ${localesDirPath} ensuring directory exists`);
  await fs.promises.mkdir(localesDirPath, { recursive: true });

  const oldLocaleData = JSON.parse(
    await readFileWithFallback(localePath, "{}")
  );
  const oldURLsLocaleData = JSON.parse(
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
        oldURLsLocaleData,
        baseFileData,
        baseURLFileData
      );

      localeDataEntries[filename] = response;
    })
  );

  let localeData = {};
  let localeURLsData = {};
  let keysToUpdate = {};

  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const { data, urlData } = localeDataEntries[filename];

      Object.keys(urlData).forEach((key) => {
        localeURLsData[key] = urlData[key];
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

  // Write locales data
  await fs.promises.writeFile(
    localePath,
    JSON.stringify(localeData, null, "\t")
  );
  console.log(`✅✅ ${localePath} updated succesfully`);

  // Write locales URL data
  await fs.promises.writeFile(
    localeURLsPath,
    JSON.stringify(localeURLsData, null, "\t")
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
  baseURLFileData,
  oldURLsLocaleData
) {
  if (!translationEntry) {
    return;
  }

  if (translationEntry !== oldURLsLocaleData[translationHTMLFilename]?.value) {
    console.log(`Detected a new URL translation: ${translationEntry}`);
    return {
      original: translationHTMLFilename,
      value: translationEntry,
    };
  }

  return {
    original: baseURLFileData[translationHTMLFilename]?.original,
    value:
      oldURLsLocaleData[translationHTMLFilename]?.value ||
      baseURLFileData[translationHTMLFilename]?.original,
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
  oldURLsLocaleData,
  baseFileData,
  baseURLFileData
) {
  const localeData = {};
  const localeURLsData = {};
  const translationsPath = getTranslationPath(
    locale,
    translationsDirPath,
    translationFilename
  );
  const fileContents = await readFileWithFallback(translationsPath, "");
  const translationHTMLFilename =
    getTranslationHTMLFilename(translationFilename);

  const data = YAML.parse(fileContents);

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
        baseURLFileData,
        oldURLsLocaleData
      );

      if (newEntry) {
        localeURLsData[translationHTMLFilename] = newEntry;
      } else if (
        // Provide a fallback if there's no translated URL so the translated URL isn't a blank string
        localeURLsData[translationHTMLFilename]?.value === "" ||
        localeURLsData[translationHTMLFilename]?.value === undefined
      ) {
        return {
          original: baseURLFileData[translationHTMLFilename]?.original,
          value: baseURLFileData[translationHTMLFilename]?.original,
        };
      }
      // Preserve old URL translation
      return {
        original: baseURLFileData[translationHTMLFilename]?.original,
        value: baseURLFileData[translationHTMLFilename]?.value,
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

  return { data: localeData, urlData: localeURLsData };
}
