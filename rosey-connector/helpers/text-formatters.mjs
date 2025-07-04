import slugify from "slugify";

function removeLinksFromMarkdown(markdownText) {
  if (!markdownText) {
    return "";
  }
  return markdownText.replaceAll(/(?:__[*#])|\[(.*?)\]\(.*?\)/gm, "$1");
}
function removeSuperAndSubFromText(text) {
  return text
    .replaceAll("<sup>", "")
    .replaceAll("</sup>", "")
    .replaceAll("<sub>", "")
    .replaceAll("</sub>", "");
}
function removeAllSpecCharsFromText(text) {
  if (!text) {
    return "";
  }
  const removedSupSub = removeSuperAndSubFromText(text);
  return removedSupSub.replaceAll(/[&\/\\#+()$~.%'!:"*<>{}_]/gm, "");
}
function removeNonPuncCharsFromText(text) {
  if (!text) {
    return "";
  }
  // We shouldn't remove any chars here that will help format context comments
  return text.replaceAll(/[#%{}_]/gm, "");
}
function formatTextForIds(text) {
  if (!text) {
    return "";
  }
  const trimmedWhiteSpace = text.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeAllSpecCharsFromText(noLinks);

  return cleanedText;
}
function formatTextForInputComments(text) {
  if (!text) {
    return "";
  }
  const trimmedWhiteSpace = text.trim();
  const noLinks = removeLinksFromMarkdown(trimmedWhiteSpace);
  const cleanedText = removeNonPuncCharsFromText(noLinks);

  return cleanedText;
}
function formatAndSlugifyText(text) {
  if (!text) {
    return "";
  }
  const formattedText = formatTextForIds(text).toLowerCase();
  return slugify(formattedText);
}

export {
  formatAndSlugifyText,
  formatTextForInputComments,
  removeSuperAndSubFromText,
};
