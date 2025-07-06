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
