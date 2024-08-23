import type { RehypePlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Element } from "hast";
import slugify from "slugify";

const generateRoseyMarkdownID = (text: string) => {
  if (!text) {
    return "";
  }
  const lowerCaseText = text.toLowerCase();
  // Remove all markdown links, and replace with just text
  const formattedText = lowerCaseText.replaceAll(
    /(?:__[*#])|\[(.*?)\]\(.*?\)/gm,
    /$1/
  );
  const slugifiedText = slugify(formattedText, { remove: /['!".*,:\/]/g });
  return `markdown:${slugifiedText}`;
};

const textElementTagNames = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "a",
];

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

      const elementsFirstChild = element.children[0];

      if (!elementsFirstChild) {
        return;
      }

      // Don't include pesky spans, which appear in codeblocks
      if (isTextElement(element) && elementsFirstChild?.value) {
        element.properties["data-rosey"] = generateRoseyMarkdownID(
          elementsFirstChild.value
        );
      }
    });
  };
};
