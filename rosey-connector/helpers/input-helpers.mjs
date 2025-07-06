import { getPageString, getYamlFileName } from "./file-helpers.mjs";
import {
  formatTextForInputComments,
  removeFormattingElementsFromText,
} from "./text-formatters.mjs";
import { htmlToMarkdown } from "./html-to-markdown.mjs";

// Input set up
function initDefaultInputs(
  data,
  translationFilesDirPath,
  page,
  locale,
  seeOnPageCommentSettings,
  gitHistoryCommentSettings
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
    const gitHistoryCommentEnabled = gitHistoryCommentSettings.enabled;
    const githubRepo = gitHistoryCommentSettings.repo_url;
    const githubBranchName = gitHistoryCommentSettings.branch_name;
    const gitHistoryCommentText = gitHistoryCommentSettings.comment_text;

    let inputComment = "";
    if (seeOnPageCommentEnabled) {
      inputComment += `[${pageString}](${baseUrl}${pageString})`;
    }
    if (gitHistoryCommentEnabled) {
      inputComment += `${
        inputComment.length > 1 ? "  //  " : ""
      }[${gitHistoryCommentText}](${githubRepo}/commits/${githubBranchName}/${translationFilesDirPath}/${locale}/${pageFilePath})`;
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

  const untranslatedPhraseMarkdown = await htmlToMarkdown(untranslatedPhrase);
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
        code: true,
        undo: true,
        redo: true,
        removeformat: true,
        copyformatting: true,
      }
    : {};

  const locationString = seeOnPageCommentEnabled
    ? generateHighlightLinkComment(
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

function generateHighlightLinkComment(
  originalPhrase,
  page,
  baseUrl,
  seeOnPageCommentText
) {
  let highlightStringToUse = "";
  // Limit to 𝑥 words at each end separated by a comma
  const urlHighlighterWordLength = 4;
  const pageString = getPageString(page);
  const startOfHighlightUrl = `[${seeOnPageCommentText}](${baseUrl}${pageString}#:~:text=`;

  // Remove things that will ruin the highlight string like formatting elements, asterisks, and backticks
  const originalPhraseNoFormattingElements =
    removeFormattingElementsFromText(originalPhrase);
  const originalPhraseNoEscapedAsterisks =
    originalPhraseNoFormattingElements.replaceAll("\\*", "*");
  const originalPhraseNoBackTicks = originalPhraseNoEscapedAsterisks.replaceAll(
    "`",
    ""
  );
  // If original phrase is less than 𝑥*2 words we don't use the comma syntax
  // Get the first and last line of the markdown so we only have complete lines in the highlight url
  const originalPhraseArray = originalPhraseNoBackTicks.split(/[\n]+/);
  // Join the original (which may be separate lines) into one string and split to check how many words
  const originalPhraseOneLineArray = originalPhraseArray.join(" ").split(" ");

  // Return early here if length of the phrase is less than urlHighlighterWordLength * 2
  if (originalPhraseOneLineArray.length < urlHighlighterWordLength * 2) {
    const encodedOriginalPhrase = customEncode(
      originalPhraseOneLineArray.join(" ")
    );

    highlightStringToUse = `${startOfHighlightUrl}${encodedOriginalPhrase})`;
    return highlightStringToUse;
  }

  // Otherwise we'll use the first 𝑥 and last 𝑥 words from the phrase
  // up to 𝑥 at the start and end and separate them by a comma
  const firstPhrase = originalPhraseArray[0];
  const lastPhrase = originalPhraseArray[originalPhraseArray.length - 1];

  // Add the first 𝑥 words of the translation to an array
  const startArrayInclPunctuation = firstPhrase
    .split(" ")
    .slice(0, urlHighlighterWordLength);
  const endHighlightArrayUnlimited = lastPhrase.split(" ");
  const endHighlightArrayInclPunctuation = endHighlightArrayUnlimited.slice(
    endHighlightArrayUnlimited.length - urlHighlighterWordLength,
    endHighlightArrayUnlimited.length
  );

  // Join, trim and encode the resulting phrases
  const startHighlightString = startArrayInclPunctuation.join(" ").trim();
  const endHighlightString = endHighlightArrayInclPunctuation.join(" ").trim();
  const encodedStartHighlightString = customEncode(startHighlightString);
  const encodedEndHighlightString = customEncode(endHighlightString);

  // Don't include the comma if the end or start phrase is empty
  // Also set the link warning to true to display a warning to users that the highlighting might be unreliable
  highlightStringToUse = `${startOfHighlightUrl}${encodedStartHighlightString},${encodedEndHighlightString})`;

  return highlightStringToUse;
}

function customEncode(text) {
  if (!text) {
    return "";
  }

  const encodeURIText = encodeURIComponent(text);
  const escapedCharsEncoded = encodeURIText.replaceAll("-", "%2D");

  return escapedCharsEncoded;
}

// Namespace pages input set up
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

async function getNamespaceInputConfig(
  inputKey,
  baseTranslationObj,
  inputLengths
) {
  const untranslatedPhrase = baseTranslationObj.original.trim();
  const untranslatedPhraseMarkdown = await htmlToMarkdown(untranslatedPhrase);
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
