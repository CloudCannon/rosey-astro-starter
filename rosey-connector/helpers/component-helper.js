import { formatAndSlugifyMarkdownText } from "./markdown-formatters.js";

export function generateRoseyId(data) {
  let text = "";
  if (!data) {
    return "";
  }
  if (typeof data === "object" && data.original) {
    text = data.original;
  }
  if (typeof data === "string") {
    text = data;
  }

  return formatAndSlugifyMarkdownText(text);
}

export function generateRoseyMarkdownID(text) {
  if (!text) {
    return "";
  }

  return `markdown:${formatAndSlugifyMarkdownText(text)}`;
}
