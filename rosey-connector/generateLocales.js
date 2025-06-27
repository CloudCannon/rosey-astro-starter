import fs from "fs";
import YAML from "yaml";
import markdownit from "markdown-it";
import path from "path";
import {
  isDirectory,
  readFileWithFallback,
  getTranslationHtmlFilename,
} from "./helpers/file-helpers.js";
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
      console.error(`❌ Encountered an error translating ${locale}:`, err);
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
  const baseUrlsFile = await fs.promises.readFile(
    configData.rosey_paths.rosey_base_urls_file_path
  );
  const baseUrlFileData = JSON.parse(baseUrlsFile.toString("utf-8")).keys;

  const localePath = path.join(localesDirPath, `${locale}.json`);
  const localeUrlsPath = path.join(localesDirPath, `${locale}.urls.json`);
  const translationsLocalePath = path.join(translationsDirPath, locale);

  // Ensure directories exist
  await fs.promises.mkdir(translationsLocalePath, { recursive: true });
  await fs.promises.mkdir(localesDirPath, { recursive: true });

  // Get last round's translations
  const oldLocaleData = JSON.parse(
    await readFileWithFallback(localePath, "{}")
  );
  const oldUrlsLocaleData = JSON.parse(
    await readFileWithFallback(localeUrlsPath, "{}")
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

  const localeData = {};
  const localeUrlsData = {};
  const keysToUpdate = {};

  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const { data, urlData } = localeDataEntries[filename];

      for (const key of Object.keys(urlData)) {
        localeUrlsData[key] = urlData[key];
      }

      for (const key of Object.keys(data)) {
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
      }
    })
  );

  // For any new translations, search for duplicate keys on each translation page
  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const translationFilePath = getTranslationPath(
        locale,
        translationsDirPath,
        filename
      );
      const fileContents = await readFileWithFallback(translationFilePath, "");
      const data = YAML.parse(fileContents);

      const updatedKeys = [];
      for (const key of Object.keys(keysToUpdate)) {
        if (data[key] || data[key] === "" || data[key] === null) {
          data[key] = keysToUpdate[key];
          updatedKeys.push(key);
        }
      }

      if (updatedKeys.length > 0) {
        const yamlString = YAML.stringify(data);
        await fs.promises.writeFile(translationFilePath, yamlString);
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
  console.log(`Locale file: ${localePath} updated succesfully`);

  // Write locales Url data
  await fs.promises.writeFile(
    localeUrlsPath,
    JSON.stringify(orderedLocaleUrlData, null, "\t")
  );
  console.log(`Locale url file: ${localeUrlsPath} updated succesfully`);
}

function getTranslationPath(locale, translationsDirPath, translationFilename) {
  return path.join(translationsDirPath, locale, translationFilename);
}

function processUrlTranslationKey(
  translationEntry,
  translationHtmlFilename,
  baseUrlFileData,
  oldUrlsLocaleData
) {
  if (!translationEntry) {
    return;
  }

  const lastTranslationUrlValue =
    oldUrlsLocaleData[translationHtmlFilename]?.value;
  const baseUrlFileOriginal =
    baseUrlFileData[translationHtmlFilename]?.original;

  if (translationEntry !== lastTranslationUrlValue) {
    console.log(`Detected a new Url translation: ${translationEntry}`);
    return {
      original: translationHtmlFilename,
      value: translationEntry,
    };
  }

  return {
    original: baseUrlFileOriginal,
    value: lastTranslationUrlValue || baseUrlFileOriginal,
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
  const oldLocaleDataValue = oldLocaleData[keyName]?.value;
  const baseFileDataOriginal = baseFileData[keyName]?.original;

  if (
    !translatedString ||
    translatedString === oldLocaleDataValue ||
    md.render(translatedString) === oldLocaleDataValue
  ) {
    return !localeData[keyName]
      ? {
          original: baseFileDataOriginal,
          value: oldLocaleDataValue || baseFileDataOriginal,
        }
      : localeData[keyName];
  }
  // If its not an old translation, write the value to the locales file
  console.log(`Detected a new translation: ${translatedString}`);
  return {
    original: baseFileDataOriginal,
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

  const translationHtmlFilename = getTranslationHtmlFilename(
    translationFilename,
    baseUrlFileData
  );

  // Check if theres a translation and
  // Add each obj to our locales data, excluding '_inputs' object.
  Object.entries(data).map(([keyName, translatedString]) => {
    if (keyName === "_inputs") {
      return;
    }

    // Write entry values to be any translated value that appears in translations files
    // If no value detected, and the locale value is an empty string, write the original to value as a fallback
    if (keyName === "urlTranslation") {
      const newEntry = processUrlTranslationKey(
        translatedString,
        translationHtmlFilename,
        baseUrlFileData,
        oldUrlsLocaleData
      );

      if (newEntry) {
        localeUrlsData[translationHtmlFilename] = newEntry;
      } else if (
        // Provide a fallback if there's no translated Url so the translated Url isn't a blank string
        localeUrlsData[translationHtmlFilename]?.value === "" ||
        localeUrlsData[translationHtmlFilename]?.value === undefined
      ) {
        return {
          original: baseUrlFileData[translationHtmlFilename]?.original,
          value: baseUrlFileData[translationHtmlFilename]?.original,
        };
      }
      // Preserve old Url translation
      return {
        original: baseUrlFileData[translationHtmlFilename]?.original,
        value: baseUrlFileData[translationHtmlFilename]?.value,
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
