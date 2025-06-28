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
  const removedSupSub = text
    .replaceAll("<sup>", "")
    .replaceAll("</sup>", "")
    .replaceAll("<sub>", "")
    .replaceAll("</sub>", "");
  return removedSupSub.replaceAll(/[&\/\\#+()$~.%'"*<>{}_]/gm, "");
}
function removeNonPuncCharsFromText(text) {
  if (!text) {
    return "";
  }
  const removedSupSub = text
    .replaceAll("<sup>", "")
    .replaceAll("</sup>", "")
    .replaceAll("<sub>", "")
    .replaceAll("</sub>", "");
  return removedSupSub.replaceAll(/[\/\\#~%"*<>{}_]/gm, "");
}
function formatMarkdownTextForIds(markdownText) {
  if (!markdownText) {
    return "";
  }
  const trimmedWhiteSpace = markdownText.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeAllSpecCharsFromText(noLinks);

  return cleanedText;
}
function formatTextForInputComments(markdownText) {
  if (!markdownText) {
    return "";
  }
  const trimmedWhiteSpace = markdownText.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeNonPuncCharsFromText(noLinks);

  return cleanedText;
}
function formatAndSlugifyText(markdownText) {
  if (!markdownText) {
    return "";
  }
  const formattedText = formatMarkdownTextForIds(markdownText).toLowerCase();
  return slugify(formattedText);
}

export { formatAndSlugifyText, formatTextForInputComments };
