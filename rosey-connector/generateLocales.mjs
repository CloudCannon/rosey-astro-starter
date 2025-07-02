import fs from "fs";
import YAML from "yaml";
import markdownit from "markdown-it";
import path from "path";
import {
  isDirectory,
  readFileWithFallback,
  getTranslationHtmlFilename,
} from "./helpers/file-helpers.mjs";
import dotenv from "dotenv";
const md = markdownit({ html: true });
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
  console.log(`\n🌍 Processing locale: ${locale}`);
  const logStatistics = {
    numberOfKeysInBaseJson: 0,
    completedTranslations: {},
    missingTranslations: {},
    numberOfKeysInUrlBaseJson: 0,
    numberOfUntranslatedUrls: {},
    numberOfTranslatedUrls: {},
  };
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
  const namespaceArray = configData.namespace_pages;

  // Update logs
  const baseFileDataKeys = Object.keys(baseFileData);
  const baseUrlFileDataKeys = Object.keys(baseUrlFileData);
  logStatistics.numberOfKeysInBaseJson = baseFileDataKeys.length;
  logStatistics.numberOfKeysInUrlBaseJson = baseUrlFileDataKeys.length;

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
    // Exit early if its a dir
    translationsFiles.map(async (filename) => {
      if (
        await isDirectory(
          getTranslationPath(locale, translationsDirPath, filename)
        )
      ) {
        return;
      }

      // Process the translation (it may be a url or a normal translation)
      const response = await processTranslation(
        locale,
        filename,
        translationsDirPath,
        oldLocaleData,
        oldUrlsLocaleData,
        baseFileData,
        baseUrlFileData,
        namespaceArray
      );

      localeDataEntries[filename] = response;
    })
  );

  const localeData = {};
  const localeUrlsData = {};
  const keysToUpdate = {};

  // Loop through all the translations,
  // including old ones and untranslated ones falling back to original
  await Promise.all(
    Object.keys(localeDataEntries).map(async (filename) => {
      const { data, urlData } = localeDataEntries[filename];

      // Sort out the url translations from the normal translations
      for (const key of Object.keys(urlData)) {
        localeUrlsData[key] = urlData[key];

        // Update stats for url translations here
        // We save the key in an object rather than incrementing a number to prevent duplicates ruining the totals
        if (urlData[key].original === urlData[key].value) {
          logStatistics.numberOfUntranslatedUrls[key] = true;
        }
        // If the value and original aren't the same, and theres something for the value, we have a translated url
        if (
          urlData[key].original !== urlData[key].value &&
          urlData[key].value
        ) {
          logStatistics.numberOfTranslatedUrls[key] = true;
        }
      }

      // Find first time translations, or new translations and add them to locale data to write
      for (const key of Object.keys(data)) {
        // Extract translation statistics for the logger
        if (data[key].untranslated) {
          logStatistics.missingTranslations[key] = true;
        }
        // If we clear a translation add it to missing translations
        // We handle duplicates below (we haven't synced up dupes to be overwritten to be blank here yet)
        if (data[key].isNewlyClearedTranslation) {
          logStatistics.missingTranslations[key] = true;
        }
        if (data[key].isTranslated) {
          logStatistics.completedTranslations[key] = true;
        }
        if (data[key].isNewTranslation) {
          logStatistics.completedTranslations[key] = true;
        }

        if (!localeData[key] || data[key].isNewTranslation) {
          const isKeyMarkdown = key.slice(0, 10).includes("markdown:");

          localeData[key] = {
            original: data[key].original,
            value:
              isKeyMarkdown && data[key].isNewTranslation
                ? md.renderInline(data[key].value)
                : data[key].value,
          };
        }

        // If new translations - prep to sync duplicate inputs on other translation pages
        if (data[key].isNewTranslation) {
          keysToUpdate[key] = data[key].value;
        }
        // If new translation is blank aka we've cleared an old one,
        // add that to keys to update to sync duplicate keys on other pages
        if (data[key].isNewlyClearedTranslation) {
          keysToUpdate[key] = "";
        }
      }
    })
  );

  // Check keysToUpdate for anything with a blank string
  // Remove any of those kets from logStatistics.completedTranslations
  // It may have snuck in there if we there are duplicate keys on separate pages

  for (const key of Object.keys(keysToUpdate)) {
    if (keysToUpdate[key] === "" && logStatistics.completedTranslations[key]) {
      delete logStatistics.completedTranslations[key];
    }
  }

  // Search for duplicate keys on each translation page for new translations
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

      // If we've found any duplicate keys to update overwrite the file
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

  // Write locales Url data
  await fs.promises.writeFile(
    localeUrlsPath,
    JSON.stringify(orderedLocaleUrlData, null, "\t")
  );

  // Log translation statistics
  console.log(`Translation statistics:`);
  console.log(`- Total Keys: ${logStatistics.numberOfKeysInBaseJson}`);
  console.log(
    `- Completed Translations: ${
      Object.keys(logStatistics.completedTranslations).length
    }`
  );
  console.log(
    `- Missing Translations: ${
      Object.keys(logStatistics.missingTranslations).length
    }`
  );

  // Only display url translation statistics if there is at least on url translation
  if (logStatistics.numberOfTranslatedUrls > 0) {
    console.log(
      `- Completed Url Translations: ${
        Object.keys(logStatistics.numberOfTranslatedUrls).length
      }`
    );
    console.log(
      `- Untranslated Urls: ${
        Object.keys(logStatistics.numberOfUntranslatedUrls).length
      }`
    );
  } else {
    console.log(`- Total Urls: ${logStatistics.numberOfKeysInUrlBaseJson}`);
  }
}

function getTranslationPath(locale, translationsDirPath, translationFilename) {
  return path.join(translationsDirPath, locale, translationFilename);
}

async function processTranslation(
  locale,
  translationFilename,
  translationsDirPath,
  oldLocaleData,
  oldUrlsLocaleData,
  baseFileData,
  baseUrlFileData,
  namespaceArray
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
    baseUrlFileData,
    namespaceArray
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
  const oldLocaleDataValue = oldLocaleData[keyName]?.value.trim();
  const baseFileDataOriginal = baseFileData[keyName]?.original.trim();

  // No translated string use the original
  if (!translatedString) {
    // Check if there was a translation the round before and we've cleared it
    if (oldLocaleDataValue && oldLocaleDataValue !== baseFileDataOriginal) {
      return {
        original: baseFileDataOriginal,
        value: baseFileDataOriginal,
        isNewlyClearedTranslation: true,
      };
    }
    // Otherwise its just not translated so use the original
    return {
      original: baseFileDataOriginal,
      value: baseFileDataOriginal,
      untranslated: true,
    };
  }

  if (
    translatedString === oldLocaleDataValue ||
    md.renderInline(translatedString) === oldLocaleDataValue
  ) {
    return !localeData[keyName]
      ? {
          original: baseFileDataOriginal,
          value: oldLocaleDataValue,
          isTranslated: true,
        }
      : localeData[keyName];
  }
  // If its not an old translation, write the value to the locales file
  return {
    original: baseFileDataOriginal,
    value: translatedString,
    isNewTranslation: true,
  };
}
