const slugify = require("slugify");

// https:markdown-it.github.io/markdown-it/#Renderer.prototype.rules
// https://github.com/markdown-it/markdown-it/blob/0fe7ccb4b7f30236fb05f623be6924961d296d3d/docs/examples/renderer_rules.md
// https://markmichon.com/custom-hr-markdown/
// https://publishing-project.rivendellweb.net/customizing-markdown-it/
// https://www.11ty.dev/docs/languages/markdown/#add-your-own-plugins

// Add the amendLibrary inside of your eleventyConfig function
// const eleventyRoseyTaggerPlugin = require("./rosey-connector/ssgs/eleventyRoseyTaggerPlugin.cjs");
// 
// module.exports = function (eleventyConfig) {
//   eleventyConfig.amendLibrary("md", eleventyRoseyTaggerPlugin);
// }

function generateRoseyId(children) {
  // Get the text content of the children
  return children.reduce((textString, child) => {
    if (child.type === "text") {
      return (textString += slugify(child.content.toLowerCase()));
    }
  }, "markdown:");
}

module.exports = function (md) {
  const proxy = (tokens, idx, options, env, self) =>
    self.renderToken(tokens, idx, options);

  // Add tags to paragraphs
  const defaultParagraphRenderer = md.renderer.rules.paragraph_open || proxy;
  md.renderer.rules.paragraph_open = function (
    tokens,
    idx,
    options,
    env,
    self
  ) {
    const nextInIndexChildren = tokens[idx + 1].children;
    const childTextAsId = generateRoseyId(nextInIndexChildren);
    tokens[idx].attrJoin("data-rosey", childTextAsId);
    return defaultParagraphRenderer(tokens, idx, options, env, self);
  };

  // Add tags to headings
  const defaultHeadingRenderer = md.renderer.rules.heading_open || proxy;
  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const nextInIndexChildren = tokens[idx + 1]?.children;
    const childTextAsId = generateRoseyId(nextInIndexChildren);
    tokens[idx].attrJoin("data-rosey", childTextAsId);
    return defaultHeadingRenderer(tokens, idx, options, env, self);
  };
};
