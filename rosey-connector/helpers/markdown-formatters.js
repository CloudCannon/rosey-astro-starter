import slugify from "slugify";

function removeLinksFromMarkdown(markdownText) {
  if (!markdownText) {
    return "";
  }
  return markdownText.replaceAll(/(?:__[*#])|\[(.*?)\]\(.*?\)/gm, /$1/);
}
function removeSpecialCharactersFromMarkdown(markdownText) {
  if (!markdownText) {
    return "";
  }
  return markdownText.replaceAll(/[&\/\\#+()$~%"*<>{}_]/gm, "");
}
function formatMarkdownText(markdownText) {
  if (!markdownText) {
    return "";
  }
  // TODO: Add the sup/sub stuff here
  const trimmedWhiteSpace = markdownText.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeSpecialCharactersFromMarkdown(noLinks);

  return cleanedText;
}
function formatAndSlugifyMarkdownText(markdownText) {
  if (!markdownText) {
    return "";
  }
  const formattedText = formatMarkdownText(markdownText).toLowerCase();
  return slugify(formattedText);
}

export { formatAndSlugifyMarkdownText, formatMarkdownText };
