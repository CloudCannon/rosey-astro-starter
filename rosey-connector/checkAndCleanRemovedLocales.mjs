import fs from "fs";
import path from "path";
import slugify from "slugify";

export async function checkAndCleanRemovedLocales(configData) {
  const currentDateTime = Date(Date.now()).toString();
  const currentDateTimeSlugified = slugify(currentDateTime);
  const archivedFilesDir = path.join(
    "rosey",
    "archived",
    currentDateTimeSlugified
  );
  const translationsDirPath = configData.rosey_paths.translations_dir_path;
  const localesDirPath = configData.rosey_paths.locales_dir_path;
  const incomingSmartlingTranslationsDirPath =
    configData.smartling.incoming_translations_dir;
  const locales = configData.locales;

  // Create an archived dir to keep old files in
  console.log(`📂📂 Ensuring archive folder exists`);
  await fs.promises.mkdir(archivedFilesDir, { recursive: true });

  // Remove extra locales in the translations directory
  console.log(`📂📂 ${translationsDirPath} ensuring folder exists`);
  await fs.promises.mkdir(translationsDirPath, { recursive: true });
  const translationDirs = await fs.promises.readdir(translationsDirPath);

  for (let i = 0; i < translationDirs.length; i++) {
    const localeDir = translationDirs[i];

    if (!locales.includes(localeDir)) {
      const pathToArchive = path.join(translationsDirPath, localeDir);
      const archiveLocaleDirPath = path.join(archivedFilesDir, localeDir);
      const archivePath = path.join(archiveLocaleDirPath, "translations");

      // Ensure the locale dir exists to move to
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      // Move the old translation files
      await fs.promises.rename(pathToArchive, archivePath);
      console.log(`Archived locale ${localeDir} translation files`);
    }
  }

  // Remove extra locales in the locales directory
  console.log(`📂📂 ${localesDirPath} ensuring folder exists`);
  await fs.promises.mkdir(localesDirPath, { recursive: true });
  const localeDirs = await fs.promises.readdir(localesDirPath);
  for (let i = 0; i < localeDirs.length; i++) {
    const localeFile = localeDirs[i];
    const localeCode = localeFile.replace(".json", "").replace(".urls", "");

    if (!locales.includes(localeCode)) {
      const filePathToArchive = path.join(localesDirPath, localeFile);

      // Ensure the locale dir exists to move to
      const archiveLocaleDirPath = path.join(
        archivedFilesDir,
        localeCode,
        "locales"
      );
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      // Move the old locale files
      const archivePath = path.join(
        archivedFilesDir,
        localeCode,
        "locales",
        localeFile
      );
      await fs.promises.rename(filePathToArchive, archivePath);
      console.log(`Archived locale ${localeCode} locale files`);
    }
  }

  // Remove incoming Smartling translation files if not in locales
  console.log(
    `📂📂 ${incomingSmartlingTranslationsDirPath} ensuring folder exists`
  );
  await fs.promises.mkdir(incomingSmartlingTranslationsDirPath, {
    recursive: true,
  });
  const smartlingTranslationFiles = await fs.promises.readdir(
    incomingSmartlingTranslationsDirPath
  );

  for (let i = 0; i < smartlingTranslationFiles.length; i++) {
    const smartlingTranslationFile = smartlingTranslationFiles[i];
    const localeCode = smartlingTranslationFile.replace(".json", "");

    if (!locales.includes(localeCode)) {
      const filePathToArchive = path.join(
        incomingSmartlingTranslationsDirPath,
        smartlingTranslationFile
      );

      // Ensure the locale dir exists to move to
      const archiveLocaleDirPath = path.join(
        archivedFilesDir,
        localeCode,
        "smartling-translations"
      );
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      const archivePath = path.join(
        archiveLocaleDirPath,
        smartlingTranslationFile
      );

      // Move the old smartling translations
      await fs.promises.rename(filePathToArchive, archivePath);
      console.log(`Archived locale ${localeCode} smartling files`);
    }
  }
}
