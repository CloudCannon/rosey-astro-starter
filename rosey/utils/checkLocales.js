import fs from "fs";
import path from "path";

export async function checkLocales(configData) {
  const translationsDirPath = configData.rosey_paths.translations_dir_path;
  const localesDirPath = configData.rosey_paths.locales_dir_path;
  const incomingSmartlingTranslationsDirPath =
    configData.smartling.incoming_translations_dir;
  const locales = configData.locales;

  // Remove extra locales in the translations directory
  console.log(`📂📂 ${translationsDirPath} ensuring folder exists`);
  await fs.promises.mkdir(translationsDirPath, { recursive: true });
  const translationDirs = await fs.promises.readdir(translationsDirPath);
  for (let i = 0; i < translationDirs.length; i++) {
    const localeDir = translationDirs[i];
    if (!locales.includes(localeDir)) {
      const dirPathToDelete = path.join(translationsDirPath, localeDir);
      await fs.promises.rm(dirPathToDelete, {
        recursive: true,
      });
      console.log("Removed old locale from translations directory");
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
      const filePathToDelete = path.join(localesDirPath, localeFile);
      await fs.promises.rm(filePathToDelete);
      console.log("Removed old locale from locales files");
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
      const filePathToDelete = path.join(
        incomingSmartlingTranslationsDirPath,
        smartlingTranslationFile
      );
      await fs.promises.rm(filePathToDelete);
      console.log("Removed old locale from incoming smartling files");
    }
  }
}
