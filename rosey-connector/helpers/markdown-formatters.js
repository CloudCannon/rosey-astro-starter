import slugify from "slugify";

function removeLinksFromMarkdown(markdownText) {
  if (!markdownText) {
    return "";
  }
  return markdownText.replaceAll(/(?:__[*#])|\[(.*?)\]\(.*?\)/gm, /$1/);
}
function removeAllSpecCharsFromText(text) {
  if (!text) {
    return "";
  }
  return text.replaceAll(/[&\/\\#+()$~.%'"*<>{}_]/gm, "");
}
function removeNonPuncCharsFromText(text) {
  if (!text) {
    return "";
  }
  return text.replaceAll(/[\/\\#~%"*<>{}_]/gm, "");
}
function formatMarkdownTextForIds(markdownText) {
  if (!markdownText) {
    return "";
  }
  // TODO: Add the sup/sub stuff here
  const trimmedWhiteSpace = markdownText.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeAllSpecCharsFromText(noLinks);

  return cleanedText;
}
function formatMarkdownTextForComments(markdownText) {
  if (!markdownText) {
    return "";
  }
  // TODO: Add the sup/sub stuff here
  const trimmedWhiteSpace = markdownText.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeNonPuncCharsFromText(noLinks);

  return cleanedText;
}
function formatAndSlugifyMarkdownText(markdownText) {
  if (!markdownText) {
    return "";
  }
  const formattedText = formatMarkdownTextForIds(markdownText).toLowerCase();
  return slugify(formattedText);
}

export { formatAndSlugifyMarkdownText, formatMarkdownTextForComments };
