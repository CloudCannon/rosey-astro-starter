import { formatAndSlugifyText } from "./text-formatters.mjs";

export function generateRoseyId(data) {
  let text = "";
  if (!data) {
    return "";
  }
  if (typeof data === "string") {
    text = data;
  }

  return formatAndSlugifyText(text);
}

export function generateRoseyMarkdownId(text) {
  if (!text) {
    return "";
  }

  return `markdown:${formatAndSlugifyText(text)}`;
}
