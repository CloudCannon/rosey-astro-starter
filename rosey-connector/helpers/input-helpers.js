import { getPageString, getYamlFileName } from "./file-helpers.js";
import { formatTextForInputComments } from "./markdown-formatters.js";
import { htmlToMarkdownHandler } from "./html-to-markdown.js";
import { NodeHtmlMarkdown } from "node-html-markdown";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

// Input set up
function initDefaultInputs(
  data,
  translationFilesDirPath,
  page,
  locale,
  seeOnPageCommentSettings,
  githubCommentSettings
) {
  // Create the inputs obj if there is none
  if (!data._inputs) {
    data._inputs = {};
  }

  // Create the page input object
  if (!data._inputs.$) {
    const pageString = getPageString(page);
    const pageFilePath = getYamlFileName(page);
    const seeOnPageCommentEnabled = seeOnPageCommentSettings.enabled;
    const baseUrl = seeOnPageCommentSettings.base_url;
    const githubCommentEnabled = githubCommentSettings.enabled;
    const githubRepo = githubCommentSettings.repo_url;
    const githubBranchName = githubCommentSettings.branch_name;
    const githubCommentText = githubCommentSettings.comment_text;

    let inputComment = "";
    if (seeOnPageCommentEnabled) {
      inputComment += `[${pageString}](${baseUrl}${pageString})`;
    }
    if (githubCommentEnabled) {
      inputComment += `${
        inputComment.length > 1 ? "  //  " : ""
      }[${githubCommentText}](${githubRepo}/commits/${githubBranchName}/${translationFilesDirPath}/${locale}/${pageFilePath})`;
    }

    data._inputs.$ = {
      type: "object",
      comment: inputComment,
      options: {
        place_groups_below: false,
        groups: [
          {
            heading: `Still to translate (${locale})`,
            comment: inputComment,
            inputs: [],
          },
          {
            heading: `Already translated (${locale})`,
            comment: inputComment,
            inputs: [],
          },
        ],
      },
    };
  }
}

async function getInputConfig(
  inputKey,
  page,
  baseTranslationObj,
  seeOnPageCommentSettings,
  inputLengths
) {
  const seeOnPageCommentEnabled = seeOnPageCommentSettings.enabled;
  const baseUrl = seeOnPageCommentSettings.base_url;
  const seeOnPageCommentText = seeOnPageCommentSettings.comment_text;
  const untranslatedPhrase = baseTranslationObj.original.trim();
  //
  const untranslatedPhraseMarkdown = nhm.translate(untranslatedPhrase);

  const tidiedUnifiedTest = await htmlToMarkdownHandler(untranslatedPhrase);
  console.log({ tidiedUnifiedTest });
  const originalPhraseTidiedForComment = formatTextForInputComments(
    untranslatedPhraseMarkdown
  );

  const isKeyMarkdown = inputKey.slice(0, 10).includes("markdown:");
  const labelCutoffLength = inputLengths.label;
  const textareaCutoffLength = inputLengths.textarea;
  const isInputShortText = untranslatedPhrase.length < textareaCutoffLength;
  const isLabelConcat =
    originalPhraseTidiedForComment.length > labelCutoffLength;

  const inputType = isKeyMarkdown
    ? "markdown"
    : isInputShortText
    ? "text"
    : "textarea";

  const options = isKeyMarkdown
    ? {
        bold: true,
        italic: true,
        strike: true,
        link: true,
        subscript: true,
        superscript: true,
        underline: true,
        undo: true,
        redo: true,
        removeformat: true,
        copyformatting: true,
      }
    : {};

  const locationString = seeOnPageCommentEnabled
    ? generateLocationString(
        originalPhraseTidiedForComment,
        page,
        baseUrl,
        seeOnPageCommentText
      )
    : false;

  const formattedLabel = isLabelConcat
    ? `${originalPhraseTidiedForComment.substring(0, labelCutoffLength)}...`
    : originalPhraseTidiedForComment;

  const inputConfig = isLabelConcat
    ? {
        label: formattedLabel,
        hidden: untranslatedPhrase === "",
        type: inputType,
        options: options,
        comment: locationString,
        context: {
          open: false,
          title: "Untranslated Text",
          icon: "translate",
          content: untranslatedPhraseMarkdown,
        },
      }
    : {
        label: formattedLabel,
        hidden: untranslatedPhrase === "",
        type: inputType,
        options: options,
        comment: locationString,
      };

  return inputConfig;
}

function generateLocationString(
  originalPhrase,
  page,
  baseUrl,
  seeOnPageCommentText
) {
  // Limit each phrase to 3 words
  const urlHighlighterWordLength = 3;
  const originalPhraseArray = originalPhrase.split(/[\n]+/);
  // Get the first and last line of the markdown so we only have complete lines in the highlight url
  const firstPhrase = originalPhraseArray[0];
  const lastPhrase = originalPhraseArray[originalPhraseArray.length - 1];
  const endHighlightArrayAll = lastPhrase.split(" ");

  const startHighlightArrayWithPunctuation = firstPhrase
    .split(" ")
    .slice(0, urlHighlighterWordLength);

  const endHighlightArrayWithPunctuation = endHighlightArrayAll.slice(
    endHighlightArrayAll.length - urlHighlighterWordLength,
    endHighlightArrayAll.length
  );

  // Look at these arrays for any words with a special character after
  // That is our last word in the start or end highlight
  // The phrase stops there in an attempt to still capture the block of text

  const startHighlightArrayWithoutPunctuation = [];
  const endHighlightArrayWithoutPunctuation = [];
  const regexToMatch = /[&#,+()$~%.":*?<>{}_]/gm;

  for (let i = 0; i < startHighlightArrayWithPunctuation.length; i++) {
    const word = startHighlightArrayWithPunctuation[i];
    const foundMatches = word.match(regexToMatch);
    if (foundMatches && foundMatches.length > 0) {
      startHighlightArrayWithoutPunctuation.push(
        word.replaceAll(regexToMatch, "")
      );
      break;
    }
    startHighlightArrayWithoutPunctuation.push(word);
  }

  for (let j = 0; j < endHighlightArrayWithPunctuation.length; j++) {
    const word = endHighlightArrayWithPunctuation[j];
    const foundMatches = word.match(regexToMatch);
    if (foundMatches && foundMatches.length > 0) {
      endHighlightArrayWithoutPunctuation.push(
        word.replaceAll(regexToMatch, "")
      );
      break;
    }
    endHighlightArrayWithoutPunctuation.push(word);
  }

  const originalPhraseArrayByWord = originalPhraseArray.join(" ").split(" ");

  // Trim and encode the resulting phrase
  const startHighlight = startHighlightArrayWithoutPunctuation.join(" ").trim();
  const endHighlight = endHighlightArrayWithoutPunctuation.join(" ").trim();

  const encodedStartHighlight = encodeURI(startHighlight);
  const encodedEndHighlight = encodeURI(endHighlight);
  const encodedOriginalPhrase = encodeURI(originalPhraseArray.join(" "));

  const pageString = getPageString(page);
  // Look to see if original phrase is 5 words or shorter
  // if it is fallback to the encoded original phrase for the highlight link
  return originalPhraseArrayByWord.length > urlHighlighterWordLength * 2
    ? `[${seeOnPageCommentText}](${baseUrl}${pageString}#:~:text=${encodedStartHighlight},${encodedEndHighlight})`
    : `[${seeOnPageCommentText}](${baseUrl}${pageString}#:~:text=${encodedOriginalPhrase})`;
}

// Common input set up

function initNamespacePageInputs(data, locale) {
  // Create the inputs obj if there is none
  if (!data._inputs) {
    data._inputs = {};
  }

  // Create the page input object
  if (!data._inputs.$) {
    data._inputs.$ = {
      type: "object",
      comment: "Translations that appear on many pages",
      options: {
        place_groups_below: false,
        groups: [
          {
            heading: `Still to translate (${locale})`,
            comment: "Text to translate",
            inputs: [],
          },
          {
            heading: `Already translated (${locale})`,
            comment: "Text already translated",
            inputs: [],
          },
        ],
      },
    };
  }
}

function getNamespaceInputConfig(inputKey, baseTranslationObj, inputLengths) {
  const untranslatedPhrase = baseTranslationObj.original.trim();
  const untranslatedPhraseMarkdown = nhm.translate(untranslatedPhrase);
  const originalPhraseTidiedForComment = formatTextForInputComments(
    untranslatedPhraseMarkdown
  );

  const isKeyMarkdown = inputKey.slice(0, 10).includes("markdown:");
  const labelCutoffLength = inputLengths.label;
  const textareaCutoffLength = inputLengths.textarea;
  const isInputShortText = untranslatedPhrase.length < textareaCutoffLength;
  const isLabelConcat =
    originalPhraseTidiedForComment.length > labelCutoffLength;

  const inputType = isKeyMarkdown
    ? "markdown"
    : isInputShortText
    ? "text"
    : "textarea";

  const options = isKeyMarkdown
    ? {
        bold: true,
        format: "p h1 h2 h3 h4",
        italic: true,
        link: true,
        undo: true,
        redo: true,
        removeformat: true,
        copyformatting: true,
        blockquote: true,
      }
    : {};

  const formattedLabel = isLabelConcat
    ? `${originalPhraseTidiedForComment.substring(0, labelCutoffLength)}...`
    : originalPhraseTidiedForComment;

  const inputConfig = isLabelConcat
    ? {
        label: formattedLabel,
        hidden: untranslatedPhrase === "",
        type: inputType,
        options: options,
        context: {
          open: false,
          title: "Untranslated Text",
          icon: "translate",
          content: untranslatedPhraseMarkdown,
        },
      }
    : {
        label: formattedLabel,
        hidden: untranslatedPhrase === "",
        type: inputType,
        options: options,
      };

  return inputConfig;
}

function sortTranslationIntoInputGroup(translationDataToWrite, inputKey) {
  if (translationDataToWrite[inputKey]?.length > 0) {
    translationDataToWrite._inputs.$.options.groups[1].inputs.push(inputKey);
  } else {
    translationDataToWrite._inputs.$.options.groups[0].inputs.push(inputKey);
  }
}

export {
  initDefaultInputs,
  getInputConfig,
  initNamespacePageInputs,
  getNamespaceInputConfig,
  sortTranslationIntoInputGroup,
};
