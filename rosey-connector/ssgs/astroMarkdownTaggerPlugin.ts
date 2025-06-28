import type { RehypePlugin } from "@astrojs/markdown-remark";
import { visit, SKIP } from "unist-util-visit";
import type { Element } from "hast";
import {
  isTextElement,
  getElementInnerText,
} from "../helpers/text-formatters.ts";
import { generateRoseyMarkdownId } from "../helpers/component-helpers.js";

// Block level elements to add tags to - inline elements should not have tag added
const textElementTagNames = ["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"];

// This only affects normal md content, not text content of snippets
// It's up to us to add data-rosey tags to the parts of snippets that need it

export const autoAddRoseyTags: RehypePlugin = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "element") {
        return;
      }
      const element = node as Element;
      if (!isTextElement(element, textElementTagNames)) {
        return;
      }
      // Get the inner text from the element
      const elementInnerText = getElementInnerText(node);
      // If there is text to generate an id from, add the id to a data-rosey tag
      if (!elementInnerText.length) {
        return;
      }
      element.properties["data-rosey"] =
        generateRoseyMarkdownId(elementInnerText);
      // Skip any children that might accidentally get a nested tag
      return SKIP;
    });
  };
};
