import fs from "fs";
import path from "path";
import slugify from "slugify";

const currentDateTime = Date(Date.now()).toString();
const currentDateTimeSlugified = slugify(currentDateTime);
const archivedFilesDir = path.join(
  "rosey",
  "archived",
  currentDateTimeSlugified
);

export async function cleanUnusedFiles(configData) {
  await removeSmartlingFilesIfDisabled(configData);
  await checkAndCleanRemovedLocales(configData);
}

async function removeSmartlingFilesIfDisabled(configData) {
  let haveWeArchivedSmartlingFiles = false;
  const smartlingEnabled = configData.smartling.smartling_enabled;

  if (smartlingEnabled) {
    return;
  }

  const incomingSmartlingDirPath =
    configData.smartling.incoming_translations_dir;

  const outgoingSmartlingFilePath =
    configData.smartling.outgoing_translations_file_path;

  // Check if the incoming dir is there otherwise, we shouldn't try move it
  let incomingSmartlingDirExists = true;
  try {
    await fs.promises.access(incomingSmartlingDirPath);
  } catch (error) {
    incomingSmartlingDirExists = false;
  }

  // If we rename the incoming dir the empty dir sometimes remains,
  // Check if there's contents otherwise we shouldn't try move it
  let incomingSmartlingHasContents = false;
  try {
    const incomingSmartlingDirContents = await fs.promises.readdir(
      incomingSmartlingDirPath
    );
    if (incomingSmartlingDirContents.length > 0) {
      incomingSmartlingHasContents = true;
    }
  } catch (error) {
    incomingSmartlingHasContents = false;
  }

  if (incomingSmartlingDirExists && incomingSmartlingHasContents) {
    // Create an archived dir to keep old files in
    await fs.promises.mkdir(archivedFilesDir, { recursive: true });

    const incomingSmartlingDirNameArr = incomingSmartlingDirPath.split("/");
    const incomingSmartlingDirName =
      incomingSmartlingDirNameArr[incomingSmartlingDirNameArr.length - 2];

    const incomingSmartlingArchivePathToWrite = path.join(
      archivedFilesDir,
      incomingSmartlingDirName
    );

    // Move the incoming smartling files
    await fs.promises.rename(
      incomingSmartlingDirPath,
      incomingSmartlingArchivePathToWrite
    );
    console.log(
      `Smartling disabled - Archived incoming Smartling translation files.`
    );
    haveWeArchivedSmartlingFiles = true;
  }

  // Check if the outgoing file is there otherwise we shouldn't try move it
  let outgoingSmartlingFileExists = true;
  try {
    await fs.promises.access(outgoingSmartlingFilePath);
  } catch (error) {
    outgoingSmartlingFileExists = false;
  }

  if (outgoingSmartlingFileExists) {
    const outgoingSmartlingDirNameArr = outgoingSmartlingFilePath.split("/");
    const outgoingTranslationsFileName =
      outgoingSmartlingDirNameArr[outgoingSmartlingDirNameArr.length - 1];

    const outgoingSmartlingArchivePathToWrite = path.join(
      archivedFilesDir,
      outgoingTranslationsFileName
    );

    // Move the outgoing smartling file
    await fs.promises.rename(
      outgoingSmartlingFilePath,
      outgoingSmartlingArchivePathToWrite
    );
    console.log(
      `Smartling disabled - Archived outgoing Smartling translation file.`
    );
    haveWeArchivedSmartlingFiles = true;
  }

  if (!haveWeArchivedSmartlingFiles) {
    console.log("No Smartling files archived.");
  }
}

async function checkAndCleanRemovedLocales(configData) {
  const haveWeArchivedFiles = [];
  const translationsDirPath = configData.rosey_paths.translations_dir_path;
  const localesDirPath = configData.rosey_paths.locales_dir_path;
  const incomingSmartlingTranslationsDirPath =
    configData.smartling.incoming_translations_dir;
  const locales = configData.locales;

  // Remove extra locales in the translations directory
  await fs.promises.mkdir(translationsDirPath, { recursive: true });
  const translationDirs = await fs.promises.readdir(translationsDirPath);

  for (let i = 0; i < translationDirs.length; i++) {
    const localeDir = translationDirs[i];

    if (!locales.includes(localeDir)) {
      // Create an archived dir to keep old files in
      await fs.promises.mkdir(archivedFilesDir, { recursive: true });

      const pathToArchive = path.join(translationsDirPath, localeDir);
      const archiveLocaleDirPath = path.join(archivedFilesDir, localeDir);
      const archivePath = path.join(archiveLocaleDirPath, "translations");

      // Ensure the locale dir exists to move to
      await fs.promises.mkdir(archiveLocaleDirPath, { recursive: true });

      // Move the old translation files
      await fs.promises.rename(pathToArchive, archivePath);
      console.log(`Archived locale ${localeDir} translation files.`);
      haveWeArchivedFiles.push(localeDir);
    }
  }

  // Remove extra locales in the locales directory
  await fs.promises.mkdir(localesDirPath, { recursive: true });

  const localeDirs = await fs.promises.readdir(localesDirPath);
  for (let i = 0; i < localeDirs.length; i++) {
    const localeFile = localeDirs[i];
    const localeCode = localeFile.replace(".json", "").replace(".urls", "");

    if (!locales.includes(localeCode)) {
      // Create an archived dir to keep old files in
      await fs.promises.mkdir(archivedFilesDir, { recursive: true });

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
      console.log(`Archived locale ${localeCode} locale files.`);
      haveWeArchivedFiles.push(localeCode);
    }
  }

  // Remove incoming Smartling translation files if not in locales
  let smartlingTranslationFiles;
  try {
    smartlingTranslationFiles = await fs.promises.readdir(
      incomingSmartlingTranslationsDirPath
    );
  } catch (error) {
    smartlingTranslationFiles = [];
  }

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
      console.log(`Archived locale ${localeCode} smartling files.`);
      haveWeArchivedFiles.push(localeCode);
    }
  }

  if (haveWeArchivedFiles.length > 0) {
    const archivedLocales = haveWeArchivedFiles.join(", ");
    console.log(`Archived ${archivedLocales} files.`);
  } else {
    console.log(`No old locales to archive.`);
  }
}
