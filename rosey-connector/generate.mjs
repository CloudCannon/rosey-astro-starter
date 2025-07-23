import fs from "fs";
import path from "path";
import YAML from "yaml";
import { input, confirm } from "@inquirer/prompts";

(async () => {
  console.log(
    `🏗️ Follow the prompts to generate the config file needed to use the Rosey CloudCannon Connector...`
  );

  console.log(
    `Answer a few questions to generate your config file. You can always change these values later.`
  );

  // Get locales for config
  const localesInput = await input({
    message: "Enter your desired locales, leaving a space between each locale.",
  });
  const localesToWrite = localesInput.split(" ");

  // Get highlight comment info for config
  const isHighlightComment = await confirm({
    message:
      "Do you want to display a comment for each translation input that links to each phrase on the untranslated page for context?",
    default: true,
  });
  const highlightCommentSettings = {
    isHighlightComment: isHighlightComment,
    untranslatedSiteUrl: "",
  };
  if (isHighlightComment) {
    highlightCommentSettings.untranslatedSiteUrl = await input({
      message: "Enter your untranslated site's URL.",
    });
  }

  // Get git history settings
  const isGitHistoryComment = await confirm({
    message:
      "Do you want to display a comment that links to each page's git history using your git provider's interface?",
    default: false,
  });
  const gitHistoryCommentSettings = {
    isGitHistoryComment: isGitHistoryComment,
    gitRepoUrl: "",
    branchToUse: "",
  };
  if (isGitHistoryComment) {
    gitHistoryCommentSettings.gitRepoUrl = await input({
      message: "Enter your git repository's URL.",
    });
    gitHistoryCommentSettings.branchToUse = await input({
      message: "Enter the branch to use.",
    });
  }

  generateConfig(
    localesToWrite,
    highlightCommentSettings,
    gitHistoryCommentSettings
  );

  console.log(`🏗️ Finished generating files...`);
})();

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
    if (highlightCommentSettings.isHighlightComment) {
      exampleFileData.see_on_page_comment.enabled = true;
      exampleFileData.see_on_page_comment.base_url =
        highlightCommentSettings.untranslatedSiteUrl;
    }
    // Add git history comment to config
    if (gitHistoryCommentSettings.isGitHistoryComment) {
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
