/**
 * @import {Root} from 'hast'
 */

import fs from "fs";
import path from "path";
import slugify from "slugify";

import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeFormat from "rehype-format";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { isDirectory } from "../rosey-connector/helpers/file-helpers.mjs";

// Find all of the .html pages in the build output
// Scan the output build dir
// Walk directories looking for .html files
// Parse the .html file looking for elements with the property of dataRoseyTagger
// Walk the contents of the element we find the tag on
// Keep walking its children until we find the most nested block elements
// Get all of their inner text for each of these elements
// Format the text, stripping it of inline html elements
// Add a data-rosey id with the formatted text
// If the innerText comes back as empty (like in a placeholder span that is for a style) don't add the tag at all
// Keep walking until we've looked through the whole page
// Keep walking until we've walked all of the .html pages
// Sanitise the html
// Parse the AST back into html and write it back to where we found it

// Looks for the tag data-rosey-tagger="true". Prop names are camelCased.
const tagNameToLookFor = "dataRoseyTagger";
const disallowedIdChars = /[*+~.()'",#%^!:@]/g;

const logStatistics = {
  tagsAdded: {},
  inlineElementsFound: {},
};

// Used for checking whether there are further nested elements in an element
// If any of these are the children in an element, we know to keep walking
const blockLevelElements = [
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ol",
  "ul",
  "li",
  "address",
  "article",
  "aside",
  "blockquote",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "header",
  "main",
  "nav",
  "noscript",
  "section",
  "table",
  "tfoot",
  "video",
];

// Main function
(async () => {
  console.log("🔎 Beginning tagging of html files...");

  // Checks for --source flag and if it has a value
  const sourceIndex = process.argv.indexOf("--source");
  let sourceDir;

  if (sourceIndex > -1) {
    // Retrieve the value after --source
    sourceDir = process.argv[sourceIndex + 1];
  }

  if (!sourceDir) {
    console.log(
      "\nPlease provide a source directory to read using the --source flag. Eg. `node rosey-tagger/main.mjs --source _site`\n"
    );
  }

  // Walk the build dir
  await walkDirs(sourceDir);
})();

// Walk dirs to find .html files, and if it finds a dir recursively calls itself on that dir
async function walkDirs(dirToTagPath) {
  const dirToTagFiles = await fs.promises.readdir(dirToTagPath);
  for (const fileName of dirToTagFiles) {
    const filePath = path.join(dirToTagPath, fileName);
    // If its an html file look for places to add data-rosey tags
    if (filePath.endsWith(".html")) {
      await readTagAndWriteHtmlFile(filePath);
    }
    // If it's a dir recursively call this fn
    const filePathIsDir = await isDirectory(filePath);
    if (filePathIsDir) {
      await walkDirs(filePath);
    }
  }
}

async function readTagAndWriteHtmlFile(filePath) {
  console.log(`\nLooking for tags to add on ${filePath}`);
  const htmlToParse = await fs.promises.readFile(filePath, "utf8");

  // Create the obj path in logStatistics where we will add the tagName
  if (!logStatistics[filePath]) {
    logStatistics[filePath] = {};
  }
  if (!logStatistics[filePath].tagsAdded) {
    logStatistics[filePath].tagsAdded = {};
  }

  // Create the obj path in logStatistics where we will add the inlineElement
  if (!logStatistics[filePath]) {
    logStatistics[filePath] = {};
  }
  if (!logStatistics[filePath].inlineElementsFound) {
    logStatistics[filePath].inlineElementsFound = {};
  }

  const file = await unified()
    .use(rehypeParse)
    .use(tagHtmlWithDataTags, { filePath: filePath })
    .use(rehypeStringify)
    .use(rehypeFormat)
    .process(htmlToParse);

  // Log out the stats from the tagging
  console.log(`\n---Tagging Statistics---`);

  const tagsAddedForThisPage = logStatistics[filePath].tagsAdded;
  if (Object.keys(tagsAddedForThisPage).length === 0) {
    console.log(`\nNo tags added.`);
  } else {
    console.log("\nBlock level elements:");
    for (const blockElement of Object.keys(tagsAddedForThisPage)) {
      console.log(`- ${blockElement}: ${tagsAddedForThisPage[blockElement]}`);
    }
  }

  const inlineElementsExtractedOnPage =
    logStatistics[filePath].inlineElementsFound;

  if (
    inlineElementsExtractedOnPage &&
    Object.keys(inlineElementsExtractedOnPage).length === 0
  ) {
    console.log(
      `\nNo inline elements in any of the block level elements we tagged.`
    );
  } else {
    console.log("\nFound and extracted text from inline elements:");
    for (const inlineElement of Object.keys(inlineElementsExtractedOnPage)) {
      console.log(
        `- ${inlineElement}: ${inlineElementsExtractedOnPage[inlineElement]}`
      );
    }
  }

  // Write tagged file
  await fs.promises.writeFile(filePath, file.value);
  console.log(`\n🖍️  Finished walking page, and wrote file: ${filePath}`);
  console.log(`---------------------------------------------\n\n`);
}

function tagHtmlWithDataTags({ filePath }) {
  /**
   * @param {Root} tree
   */

  return function (tree) {
    visit(tree, "element", function (node) {
      // Check for the tag name we're looking for on any html element
      if (Object.keys(node.properties).includes(tagNameToLookFor)) {
        console.log(
          `Found the tag we're looking for on the \<${node.tagName}> element on line ${node.position.start.line}, walking contents now...`
        );
        // Walk the contents of the element we find the tag on
        walkChildren(node, filePath);
      }
    });
  };
}

function walkChildren(node, filePath) {
  for (const child of node.children) {
    if (!nodeIsWhiteSpace(child) && child.children) {
      // Keep walking until we find the most nested block elements
      if (hasNestedBlockElements(child.children)) {
        walkChildren(child, filePath);
      } else {
        // Found the lowest block level element
        const innerText = extractTextChildren(child.children, filePath);
        // Add a data-rosey tag to it with slugified inner text if no data-rosey tag already there
        if (innerText && !Object.keys(child.properties).includes("dataRosey")) {
          child.properties["data-rosey"] = slugify(innerText, {
            remove: disallowedIdChars,
          });
          // If there is already a running total for the tagName in the logStatistics obj for this page increment by 1
          if (
            logStatistics[filePath]?.tagsAdded &&
            logStatistics[filePath]?.tagsAdded[child.tagName]
          ) {
            logStatistics[filePath].tagsAdded[child.tagName] += 1;
            // If there isnt already a running total for the tagName in the logStatistics obj for this page start at 1
          } else {
            logStatistics[filePath].tagsAdded[child.tagName] = 1;
          }
        }
      }
    }
  }
}

// Some nodes are just whitespace
function nodeIsWhiteSpace(node) {
  if (node.type === "text" && node.value.replaceAll("\n", "").trim() === "") {
    return true;
  }
  return false;
}

function hasNestedBlockElements(node) {
  let itDoes = false;
  for (const child of node) {
    if (
      child.type === "element" &&
      blockLevelElements.includes(child.tagName)
    ) {
      itDoes = true;
    }
  }
  return itDoes;
}

// Extract the text from inside the most nested block level elements
function extractTextChildren(node, filePath) {
  let innerText = "";
  for (const child of node) {
    // If the child is text, and doesn't have its own inline element children add to the inner text
    if (child.value) {
      const innerTextFormatted = child.value.replaceAll("\n", "");
      innerText += innerTextFormatted;
      // Otherwise use a recursive function to walk through the inline elements, which are also children
    } else {
      innerText += getInnerTextFromInlineElements(child, filePath);
    }
  }
  return innerText;
}

// A recursive function to get the inner text, which is kept track of in the calling function (extractTextChildren)
function getInnerTextFromInlineElements(node, filePath) {
  let innerText = "";
  for (const child of node.children) {
    if (child.value) {
      const innerTextFormatted = child.value;
      innerText += innerTextFormatted;
      // If there is already a running total for the inlineElements in the logStatistics obj for this page increment by 1
      if (
        logStatistics[filePath]?.inlineElementsFound &&
        logStatistics[filePath].inlineElementsFound[node.tagName]
      ) {
        logStatistics[filePath].inlineElementsFound[node.tagName] += 1;
      } else {
        // If there isnt already a running total for the inlineElements in the logStatistics obj for this page start at 1
        logStatistics[filePath].inlineElementsFound[node.tagName] = 1;
      }
    } else {
      innerText += getInnerTextFromInlineElements(child, filePath);
    }
  }
  return innerText;
}
