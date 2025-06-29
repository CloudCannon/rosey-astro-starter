import type { Element } from "hast";

const isTextElement = (element: Element, textElementTagNames: Array<string>) =>
  textElementTagNames.includes(element.tagName);

// This checks three levels deep of nesting in an AST for text
function getElementInnerText(node: any) {
  let elementInnerText = "";
  for (const child of node.children) {
    if (child.type === "text") {
      const childFormatted = child.value;
      elementInnerText += childFormatted;
    }
    if (child.type === "element" && child.children) {
      for (const grandchild of child.children) {
        if (grandchild.type === "text") {
          const grandChildFormatted = grandchild.value;
          elementInnerText += grandChildFormatted;
        }
        if (grandchild.type === "element" && grandchild.children) {
          for (const greatGrandchild of grandchild.children) {
            if (greatGrandchild.type === "text") {
              const greatGrandChildFormatted = greatGrandchild.value
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