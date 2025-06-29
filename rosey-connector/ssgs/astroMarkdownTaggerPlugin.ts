import type { RehypePlugin } from "@astrojs/markdown-remark";
import { visit, SKIP } from "unist-util-visit";
import type { Element } from "hast";
import { generateRoseyMarkdownID } from "../helpers/component-helper.js";

// Block level elements to add tags to - inline elements should not have tag added
const textElementTagNames = ["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"];

const isTextElement = (element: Element) =>
  textElementTagNames.includes(element.tagName);

// This only affects normal md content, not text content of snippets
// It's up to us to add data-rosey tags to the parts of snippets that need it

export const autoAddRoseyTags: RehypePlugin = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "element") {
        return;
      }
      const element = node as Element;

      if (!isTextElement(element)) {
        return;
      }

      // Get the inner text from the element
      let elementInnerText = "";

      if (element.children) {
        element.children.forEach((child) => {
          if (child.type === "text") {
            elementInnerText += child.value;
          }
          if (child.type === "element" && child.children) {
            child.children.forEach((childsChild) => {
              if (childsChild.type === "text") {
                elementInnerText += childsChild.value;
              }
            });
          }
        });
      }
      // If there is text to generate an id from, add the id to a data-rosey tag
      if (!elementInnerText.length) {
        return;
      }

      element.properties["data-rosey"] =
        generateRoseyMarkdownID(elementInnerText);

      // Skip any children that might accidentally get a nested tag
      return SKIP;
    });
  };
};
