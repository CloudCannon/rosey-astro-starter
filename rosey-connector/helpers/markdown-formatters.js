import slugify from "slugify";

function formatAndSlugifyMarkdownText(markdownText) {
  if (!markdownText) {
    return "";
  }
  const lowerCaseText = markdownText.toLowerCase();
  const formattedLinks = lowerCaseText.replaceAll(
    /(?:__[*#])|\[(.*?)\]\(.*?\)/gm,
    /$1/
  );
  return slugify(formattedLinks, { remove: /[.*,:\/]/g });
}

export { formatAndSlugifyMarkdownText };
