import slugify from "slugify";

// Used for removing elements from text for links.
// Spaces have already been worked out whether to be preserved around these eles by htmlToMarkdown
// hr and br are the exception where they will always represent a new word and therefore a space
function removeFormattingElementsForHiglightUrls(text) {
  return text
    .replaceAll("<sup>", "")
    .replaceAll("</sup>", "")
    .replaceAll("<sub>", "")
    .replaceAll("</sub>", "")
    .replaceAll("<br>", " ")
    .replaceAll("<hr>", " ");
}

function formatTextForInputComments(text) {
  if (!text) {
    return "";
  }
  const trimmedWhiteSpace = text.trim();
  const escapedAsterisks = trimmedWhiteSpace.replaceAll("\\*", "*");
  const noLinks = escapedAsterisks.replaceAll(
    /(?:__[*#])|\[(.*?)\]\(.*?\)/gm,
    "$1"
  );
  const removedNonPunctuationSpecChars = noLinks.replaceAll(/[#%`{}_]/gm, "");
  return removedNonPunctuationSpecChars;
}
function customEncodingForIds(text) {
  if (!text) {
    return "";
  }

  const vanillaEncode = encodeURIComponent(text);
  // Periods ruin yml keys but are escaped by encodeURIComponent so we need to manually encode them
  // https://www.w3schools.com/tags/ref_urlencode.ASP - handy list of encoded chars
  const fullyEncoded = vanillaEncode.replaceAll(".", "%2E");
  return fullyEncoded;
}
function generateRoseyId(text) {
  if (!text) {
    return "";
  }
  // const formattedText = formatTextForIds(text).toLowerCase();
  const slugifiedText = slugify(text);
  // Dont remove special chars, just encode them
  const encodedSlug = customEncodingForIds(slugifiedText);
  return encodedSlug;
}

export {
  generateRoseyId,
  formatTextForInputComments,
  removeFormattingElementsForHiglightUrls,
};
