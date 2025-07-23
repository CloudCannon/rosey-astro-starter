import { readConfigFile, handleConfigPaths } from "./helpers/file-helpers.mjs";
import { configWarnings } from "./configWarnings.mjs";
import { checkAndCleanRemovedLocales } from "./cleanUnusedFiles.mjs";
import { callSmartling } from "./callSmartling.mjs";
import { generateTranslationFiles } from "./generateTranslationFiles.mjs";
import { generateLocales } from "./generateLocales.mjs";
import { generateConfig } from "./generateConfig.mjs";

(async () => {
  console.log("\n--- Starting Rosey CloudCannon Connector ---");

  console.log("\n🏗️ Reading config file...");
  // Check for a config file and generate one if not found
  await generateConfig();
  const configData = await readConfigFile(
    handleConfigPaths("./rosey/rcc.yaml")
  );

  // Some warnings for commonly forgotten unconfigured values
  configWarnings(configData);

  console.log("\n\n🏗️ Checking for content to archive...");
  await checkAndCleanRemovedLocales(configData);

  console.log("\n\n🏗️ Generating translation files...");
  await generateTranslationFiles(configData);
  console.log("\n🏗️ Finished generating translation files!");

  if (configData.smartling.enabled) {
    console.log("\n\n🤖 Calling Smartling for translations...");
    await callSmartling(configData);
    console.log("🤖 Finished calling & generating Smartling files!");
  }

  console.log("\n\n🏗️ Generating locales files...");
  await generateLocales(configData);
  console.log("\n🏗️ Finished generating locales files!");

  console.log("\n--- Finished Rosey CloudCannon Connector ---");
})();
