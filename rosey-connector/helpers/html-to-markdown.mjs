/**
 * @import {Html} from 'mdast'
 */
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { toHtml } from "hast-util-to-html";

async function htmlToMarkdown(html) {
  const testingUnifiedParse = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      handlers: {
        br(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          return result;
        },
        sup(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          const trimmedResult = result;
          return trimmedResult;
        },
        sub(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          return result;
        },
        s(state, node) {
          /** @type {Html} */
          const result = { type: "html", value: toHtml(node) };
          state.patch(node, result);
          return result;
        },
      },
    })
    .use(remarkStringify)
    .process(html);
  // TODO: Perhaps we shouldn't do the below, and instead add css that make it look like there is space
  // For some reason when we handle unknown nodes above, it adds a bunch of new lines around it
  // Replacing with nothing means there is no space between the previous word and the handled element
  // Replacing with a space is the best we can do for now
  const tidiedUnifiedTest = testingUnifiedParse.value.replaceAll("\n\n", " ");
  return tidiedUnifiedTest;
}

export { htmlToMarkdown };
