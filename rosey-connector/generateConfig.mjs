import fs from "fs";
import path from "path";
import YAML from "yaml";

export async function generateConfig(
  locales,
  highlightCommentSettings,
  gitHistoryCommentSettings
) {
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
    const exampleFileData = YAML.parse(buffer.toString("utf-8"));

    // Add to the config file if this is being generated via the cli,
    // otherwise just use the example file if it's happening automatically

    // Add locales to the config
    if (locales?.length) {
      exampleFileData.locales = locales;
    }
    // Add highlight comment to config
    if (highlightCommentSettings?.isHighlightComment) {
      exampleFileData.see_on_page_comment.enabled = true;
      exampleFileData.see_on_page_comment.base_url =
        highlightCommentSettings.untranslatedSiteUrl;
    }
    // Add git history comment to config
    if (gitHistoryCommentSettings?.isGitHistoryComment) {
      exampleFileData.git_history_link.enabled = true;
      exampleFileData.git_history_link.repo_url =
        gitHistoryCommentSettings.gitRepoUrl;
      exampleFileData.git_history_link.branch_name =
        gitHistoryCommentSettings.branchToUse;
    }

    // Write the example config to the correct place
    await fs.promises.writeFile(configPath, YAML.stringify(exampleFileData));
    console.log("🏗️ Generated an RCC config file!");
  }
}
