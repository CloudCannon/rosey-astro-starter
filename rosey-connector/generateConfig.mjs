import fs from "fs";
import path from "path";

export async function generateConfig() {
  const configPath = path.join("rosey", "rcc.yaml");

  // Check if a config already exists
  try {
    await fs.promises.access(configPath);
    return;
  } catch (error) {
    console.log("🏗️ No existing config file - Creating one...");
    // If not read the example one
    const exampleConfigPath = path.join(
      "rosey-connector",
      "helpers",
      "example-config.yaml"
    );
    const buffer = await fs.promises.readFile(exampleConfigPath);
    const exampleFileData = buffer.toString("utf-8");

    // Write the example config to the correct place
    await fs.promises.writeFile(configPath, exampleFileData);
    console.log("🏗️ Generated an RCC config file!");
  }
}
