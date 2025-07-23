import { input, confirm } from "@inquirer/prompts";
import { generateConfig } from "./generateConfig.mjs";

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
