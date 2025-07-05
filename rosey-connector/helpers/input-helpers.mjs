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

// TODO: Check if the highlightStringToUse is likely to fail, and provide a fallback message where this is called
// Eg. Could not generate a highlight link, go to page and use cmd+f(Mac) or ctrl+f(other OS)
function generateLocationString(
  originalPhrase,
  page,
  baseUrl,
  seeOnPageCommentText
) {
  let highlightStringToUse = "";
  // Limit to 𝑥 words at each end separated by a comma
  const urlHighlighterWordLength = 3;
  const pageString = getPageString(page);
  const startOfHighlightUrl = `[${seeOnPageCommentText}](${baseUrl}${pageString}#:~:text=`;
  // We have to handle unsupported special chars while trying get as many words without them as we can
  const illegalChars = /[&#,\-/+)($~%".:*?<>{}_]/gm;
  // TODO: Test if we need to exclude
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
    const encodedOriginalPhrase = encodeURI(
      originalPhraseOneLineArray.join(" ")
    );

    // TODO: Check here if there are special chars in the original and try capture a start and end

    highlightStringToUse = `${startOfHighlightUrl}${encodedOriginalPhrase})`;
    return highlightStringToUse;
  }

  // Otherwise we'll use the first 𝑥 and last 𝑥 words from the phrase
  // up to 𝑥 at the start and end and separate them by a ","
  const firstPhrase = removeSuperAndSubFromText(originalPhraseArray[0]);

  // Add the first 𝑥 words of the translation to an array
  const startArrayInclPunctuation = firstPhrase
    .split(" ")
    .slice(0, urlHighlighterWordLength);

  // Look at the start and end arrays for any word with a special character in it
  // The phrase stops there in an attempt to still capture the block of text
  const startHighlightArrayNoPunctuation = [];

  // TODO: This could become a function to use for start and end
  // Props: arrayInclPunctuation , illegalChars
  // Return arrayNoPunctuation
  for (const [index, word] of startArrayInclPunctuation.entries()) {
    // Look for special chars in a word which will ruin the highlight url
    const foundMatchAtIndex = word.search(illegalChars);
    const wordIsFirst = index === 0;
    const indexOfSpecialChar = foundMatchAtIndex > -1 ? foundMatchAtIndex : 0;

    // If it is the first word:
    // If we find a special character in the word don't push anything, but also don't break the loop
    // If the word is first in the string we can safely attempt to capture the rest of the phrase still
    if (wordIsFirst && !indexOfSpecialChar) {
      startHighlightArrayNoPunctuation.push(word);
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
        startHighlightArrayNoPunctuation.push(wordUntilSpecChar);
        break;
      } else {
        startHighlightArrayNoPunctuation.push(word);
      }
    }
  }

  const lastPhrase = removeSuperAndSubFromText(
    originalPhraseArray[originalPhraseArray.length - 1]
  );
  // Add the last 𝑥 words of the translation to an array
  const endHighlightArrayUnlimited = lastPhrase.split(" ");
  const endHighlightArrayInclPunctuation = endHighlightArrayUnlimited.slice(
    endHighlightArrayUnlimited.length - urlHighlighterWordLength,
    endHighlightArrayUnlimited.length
  );

  const endHighlightArrayNoPunctuation = [];

  for (const [index, word] of endHighlightArrayInclPunctuation.entries()) {
    // Look for special chars in a word which will ruin the highlight url
    const foundMatchAtIndex = word.search(illegalChars);
    const indexOfSpecialChar = foundMatchAtIndex > -1 ? foundMatchAtIndex : 0;

    // If the word is first in the string we can attempt to capture the rest still
    const wordIsFirst = index === 0;
    if (wordIsFirst && !indexOfSpecialChar) {
      endHighlightArrayNoPunctuation.push(word);
    }

    if (!wordIsFirst) {
      if (indexOfSpecialChar) {
        const wordUntilSpecChar = word.slice(0, indexOfSpecialChar);
        endHighlightArrayNoPunctuation.push(wordUntilSpecChar);
        break;
      } else {
        endHighlightArrayNoPunctuation.push(word);
      }
    }
  }

  // Trim and encode the resulting phrase
  const startHighlightString = startHighlightArrayNoPunctuation
    .join(" ")
    .trim();
  const endHighlightString = endHighlightArrayNoPunctuation.join(" ").trim();
  const encodedStartHighlightString = encodeURI(startHighlightString);
  const encodedEndHighlightString = encodeURI(endHighlightString);

  // Don't include the "," if the end or start phrase is empty otherwise separate by a comma
  if (startHighlightString?.length > 0 && endHighlightString?.length > 0) {
    highlightStringToUse = `${startOfHighlightUrl}${encodedStartHighlightString},${encodedEndHighlightString})`;
  } else {
    highlightStringToUse = `${startOfHighlightUrl}${encodedStartHighlightString}${encodedEndHighlightString})`;
  }

  return highlightStringToUse;
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
