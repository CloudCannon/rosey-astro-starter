import type { Element } from "hast";


const isTextElement = (element: Element, textElementTagNames: Array<string>) =>
  textElementTagNames.includes(element.tagName);

const formatInnerText = (text: string) => {
  if (!text) {
    return "";
  }
  const removedSup = text.replaceAll("<sup>", "").replaceAll("</sup>", "");
  const removedSub = removedSup
    .replaceAll("<sub>", "")
    .replaceAll("</sub>", "");
  return removedSub;
};

// This checks three levels deep of nesting in an AST for text
function getElementInnerText(node) {
  let elementInnerText = "";
  for (const child of node.children) {
    if (child.type === "text") {
      const childFormatted = formatInnerText(child.value);
      elementInnerText += childFormatted;
    }
    if (child.type === "element" && child.children) {
      for (const grandchild of child.children) {
        if (grandchild.type === "text") {
          const grandChildFormatted = formatInnerText(grandchild.value);
          elementInnerText += grandChildFormatted;
        }
        if (grandchild.type === "element" && grandchild.children) {
          for (const greatGrandchild of grandchild.children) {
            if (greatGrandchild.type === "text") {
              const greatGrandChildFormatted = formatInnerText(
                greatGrandchild.value
              );
              elementInnerText += greatGrandChildFormatted;
            }
          }
        }
      }
    }
  }
  return elementInnerText;
}

export {
  isTextElement,
  getElementInnerText
}