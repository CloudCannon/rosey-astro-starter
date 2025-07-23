/**
 * @import {Html} from 'mdast'
 */
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { toHtml } from "hast-util-to-html";

async function htmlToMarkdown(html) {
  const positionalInfoOfHandlers = {};
  const parsedHTML = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      handlers: {
        br(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          positionalInfoOfHandlers[`sub${node.position.start.column}`] =
            node.position;
          return result;
        },
        sup(state, node) {
          /** @type {Html} */
          const result = {
            type: "html",
            value: toHtml(node),
          };
          state.patch(node, result);
          positionalInfoOfHandlers[`sup${node.position.start.column}`] =
            node.position;
          return result;
        },
        sub(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          positionalInfoOfHandlers[`br${node.position.start.column}`] =
            node.position;
          return result;
        },
        s(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          positionalInfoOfHandlers[`s${node.position.start.column}`] =
            node.position;
          return result;
        },
      },
    })
    .use(remarkStringify)
    .process(html);

  // For some reason when we handle unknown nodes above, it adds a bunch of new lines around it
  // Replacing with nothing means there is no space between the previous word and the handled element
  // When sometimes there should be, which ruins the output html and the highlight link
  // We need to find a way to detect whether to
  // - collapse to nothing
  // - collapse to a space

  // Save the positional info of where each of the specially handled elements are in an object
  // Loop through the keys of the object and for each
  // Detect in the original string whether there was a space in the html before or after the element
  // If there is a space replace the \n\n with " " otherwise replace with nothing

  let formattedMarkdown = parsedHTML.value;

  for (const key of Object.keys(positionalInfoOfHandlers)) {
    // Get the info from the object
    const positionalInfoOfHandler = positionalInfoOfHandlers[key];
    // Find the start and col index in the unparsed html then find one either side of it
    const startCol = positionalInfoOfHandler.start.offset;
    const endCol = positionalInfoOfHandler.end.offset;
    const oneBeforeStartCol = startCol - 1;
    const oneAfterEndCol = endCol + 1;
    // Get a string that includes the whole custom handled element, with one char either side
    const stringWithTrailingAndLeadingChars = html.slice(
      oneBeforeStartCol,
      oneAfterEndCol
    );
    // Find out the value of the first char (the one immediately before the el)
    const firstCharInPreParsedString = stringWithTrailingAndLeadingChars[0];
    // Find out the value of the last char (the one immediately after the el)
    const lastCharInPreParsedString =
      stringWithTrailingAndLeadingChars[
        stringWithTrailingAndLeadingChars.length - 1
      ];
    // If it is a space, preserve it, otherwise collapse the new lines to nothing
    if (firstCharInPreParsedString === " ") {
      formattedMarkdown = formattedMarkdown.replace("\n\n", " ");
    } else {
      formattedMarkdown = formattedMarkdown.replace("\n\n", "");
    }
    if (lastCharInPreParsedString === " ") {
      formattedMarkdown = formattedMarkdown.replace("\n\n", " ");
    } else {
      formattedMarkdown = formattedMarkdown.replace("\n\n", "");
    }
  }

  return formattedMarkdown;
}

export { htmlToMarkdown };
