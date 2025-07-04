export function configWarnings(configData) {
  // If no locales
  if (configData.locales.length === 0) {
    console.log(`⚠️ No locales configured to generate files for!`);
  }
  // If no context comment url is set
  const contextComment = configData.see_on_page_comment;
  const defaultCommentUrl = "https://adjective-noun.cloudvent.net/";
  if (contextComment.enabled) {
    if (
      contextComment.base_url === defaultCommentUrl ||
      !contextComment.base_url
    ) {
      console.log(
        `⚠️ Base url for on page comments is enabled but not configured!`
      );
    }
  }
  // If no github history url is set
  const githubHistory = configData.git_history_link;
  const defaultGitHubUrl = "https://github.com/org/repo";
  if (githubHistory.enabled) {
    if (
      githubHistory.base_url === defaultGitHubUrl ||
      !githubHistory.repo_url
    ) {
      console.log(
        `⚠️ Base url for on page comments is enabled but not configured!`
      );
    }
  }
}
