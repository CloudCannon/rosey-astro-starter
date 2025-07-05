import { getPageString, getYamlFileName } from "./file-helpers.mjs";
import {
  formatTextForInputComments,
  removeSuperAndSubFromText,
} from "./text-formatters.mjs";
import { htmlToMarkdown } from "./html-to-markdown.mjs";

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

  // If not enough words in the link display a warning as part of the comment
  const warningComment =
    "Warning: If highlighting is unsuccessful, use the CMD+F/CTRL+F shortcut to locate the phrase manually.";
  let formattedComment = `${locationString.highlightStringToUse}\n${
    locationString.warning ? warningComment : ""
  }`;

  const inputConfig = isLabelConcat
    ? {
        label: formattedLabel,
        hidden: untranslatedPhrase === "",
        type: inputType,
        options: options,
        comment: formattedComment,
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
        comment: formattedComment,
      };

  return inputConfig;
}

function generateLocationString(
  originalPhrase,
  page,
  baseUrl,
  seeOnPageCommentText
) {
  let highlightStringToUse = "";
  let warning = false;
  // Limit to 𝑥 words at each end separated by a comma
  // TODO:
  // Add these magic numbers to config file and update readme
  // Add the ability to turn off these warnings
  const urlHighlighterWordLength = 3;
  const wordWarningThreshold = 3;
  const commaSeparatedWordWarningThreshold = 1;
  const pageString = getPageString(page);
  const startOfHighlightUrl = `[${seeOnPageCommentText}](${baseUrl}${pageString}#:~:text=`;
  // We have to handle unsupported special chars while trying get as many words without them as we can
  const illegalChars = /[&#,\-/+)($~%".:*?<>{}_]/gm;
  // TODO: Test if we actually need to exclude
  // "
  // .
  // ' seems to work all good

  // If original phrase is less than 𝑥*2 words we don't use the comma syntax
  // Get the first and last line of the markdown so we only have complete lines in the highlight url
  const originalPhraseArray = originalPhrase.split(/[\n]+/);
  // Join the original (which may be separate lines) into one string and split to check how many words
  const originalPhraseOneLineArray = originalPhraseArray.join(" ").split(" ");

  // Return early here if length of the phrase is less than urlHighlighterWordLength * 2
  if (originalPhraseOneLineArray.length < urlHighlighterWordLength * 2) {
    const originalPhraseOneLineArrayNoPunc = filterPunctuationForLocationString(
      originalPhraseOneLineArray,
      illegalChars
    );

    const encodedOriginalPhrase = encodeURIComponent(
      originalPhraseOneLineArray.join(" ")
    );
    if (originalPhraseOneLineArrayNoPunc.length < wordWarningThreshold) {
      warning = true;
    }

    highlightStringToUse = `${startOfHighlightUrl}${encodedOriginalPhrase})`;
    return { highlightStringToUse: highlightStringToUse, warning: warning };
  }

  // Otherwise we'll use the first 𝑥 and last 𝑥 words from the phrase
  // up to 𝑥 at the start and end and separate them by a comma
  const firstPhrase = removeSuperAndSubFromText(originalPhraseArray[0]);
  const lastPhrase = removeSuperAndSubFromText(
    originalPhraseArray[originalPhraseArray.length - 1]
  );

  // Add the first 𝑥 words of the translation to an array
  const startArrayInclPunctuation = firstPhrase
    .split(" ")
    .slice(0, urlHighlighterWordLength);
  const endHighlightArrayUnlimited = lastPhrase.split(" ");
  const endHighlightArrayInclPunctuation = endHighlightArrayUnlimited.slice(
    endHighlightArrayUnlimited.length - urlHighlighterWordLength,
    endHighlightArrayUnlimited.length
  );

  // Look at the start and end arrays for any word with a special character in it
  // The phrase stops there in an attempt to still capture the block of text
  const startHighlightArrayNoPunctuation = filterPunctuationForLocationString(
    startArrayInclPunctuation,
    illegalChars
  );
  const endHighlightArrayNoPunctuation = filterPunctuationForLocationString(
    endHighlightArrayInclPunctuation,
    illegalChars
  );

  // Display a warning if the combined word count is less than the warning threshold
  if (
    startArrayInclPunctuation.length + endHighlightArrayNoPunctuation.length <
    wordWarningThreshold
  ) {
    warning = true;
  }

  // Display a warning if the word count either side of the comma are less than the warning threshold
  if (
    startHighlightArrayNoPunctuation.length <
      commaSeparatedWordWarningThreshold ||
    endHighlightArrayNoPunctuation.length < commaSeparatedWordWarningThreshold
  ) {
    warning = true;
  }

  // Join, trim and encode the resulting phrases
  const startHighlightString = startHighlightArrayNoPunctuation
    .join(" ")
    .trim();
  const endHighlightString = endHighlightArrayNoPunctuation.join(" ").trim();
  const encodedStartHighlightString = encodeURI(startHighlightString);
  const encodedEndHighlightString = encodeURI(endHighlightString);

  // Don't include the comma if the end or start phrase is empty
  // Also set the link warning to true to display a warning to users that the highlighting might be unreliable
  if (startHighlightString?.length > 0 && endHighlightString?.length > 0) {
    highlightStringToUse = `${startOfHighlightUrl}${encodedStartHighlightString},${encodedEndHighlightString})`;
  } else {
    highlightStringToUse = `${startOfHighlightUrl}${encodedStartHighlightString}${encodedEndHighlightString})`;
    warning = true;
  }

  return { highlightStringToUse: highlightStringToUse, warning: warning };
}

function filterPunctuationForLocationString(
  arrayInclPunctuation,
  illegalChars
) {
  const arrayNoPunctuation = [];
  for (const [index, word] of arrayInclPunctuation.entries()) {
    // Look for special chars in a word which will ruin the highlight url
    const foundMatchAtIndex = word.search(illegalChars);
    const wordIsFirst = index === 0;
    const indexOfSpecialChar = foundMatchAtIndex > -1 ? foundMatchAtIndex : 0;

    // If it is the first word:
    // If we find a special character in the word don't push anything, but also don't break the loop
    // If the word is first in the string we can safely attempt to capture the rest of the phrase still
    if (wordIsFirst && !indexOfSpecialChar) {
      arrayNoPunctuation.push(word);
    }

    // If not the first word:
    // If we find a special character in a word, we want to include the word up until the *first* special character
    // To do this we need to loop through the word and find the index of the first special char
    // Then we split the word so that we can push the word up until that point
    // This will handle words with a hyphen or slash in the middle, and comma's/periods at the end of a word
    // After pushing the word, break (we don't know it's the last word)

    if (!wordIsFirst) {
      if (indexOfSpecialChar) {
        const wordUntilSpecChar = word.slice(0, indexOfSpecialChar);
        arrayNoPunctuation.push(wordUntilSpecChar);
        break;
      } else {
        arrayNoPunctuation.push(word);
      }
    }
  }
  return arrayNoPunctuation;
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
