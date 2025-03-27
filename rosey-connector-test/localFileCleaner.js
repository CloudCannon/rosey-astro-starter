import { checkLocales } from "./checkLocales.js";
import { readConfigFile } from "./helpers/file-helper.js";

(async () => {
  const configData = await readConfigFile("./rosey/config.yaml");
  console.log("🏗️🏗️ Checking locales...");
  await checkLocales(configData);
  console.log("🏗️🏗️ Checked locales...");
})();
