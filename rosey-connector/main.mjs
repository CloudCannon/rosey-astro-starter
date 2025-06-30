import { readConfigFile } from "./helpers/file-helpers.mjs";
import { checkAndCleanRemovedLocales } from "./checkAndCleanRemovedLocales.mjs";
import { callSmartling } from "./callSmartling.mjs";
import { generateTranslationFiles } from "./generateTranslationFiles.mjs";
import { generateLocales } from "./generateLocales.mjs";
import { generateConfig } from "./generateConfig.mjs";

(async () => {
  console.log("🏗️ Checking a config file exists...");
  await generateConfig();
  const configData = await readConfigFile("./rosey/rcc.yaml");
  console.log("🏗️ Cleaning old content...");
  await checkAndCleanRemovedLocales(configData);
  console.log("🏗️ Cleaned content!");
  if (configData.smartling.smartling_enabled) {
    console.log("🏗️ Calling Smartling for translations...");
    await callSmartling(configData);
    console.log("🏗️ Finished calling & generating Smartling files!");
  }
  console.log("🏗️ Generating translation files...");
  await generateTranslationFiles(configData);
  console.log("🏗️ Finished generating translation files!");
  console.log("🏗️ Generating locales files...");
  await generateLocales(configData);
  console.log("🏗️ Finished generating locales files!");
})();
