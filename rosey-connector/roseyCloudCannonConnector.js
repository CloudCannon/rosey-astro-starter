import { readConfigFile } from "./helpers/file-helpers.js";
import { checkLocales } from "./checkLocales.js";
import { callSmartling } from "./callSmartling.js";
import { generateTranslationFiles } from "./generateTranslationFiles.js";
import { generateLocales } from "./generateLocales.js";

(async () => {
  const configData = await readConfigFile("./rosey/config.yaml");
  console.log("🏗️ Checking locales...");
  await checkLocales(configData);
  console.log("🏗️ Checked locales!");
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
