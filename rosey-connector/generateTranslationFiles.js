import fs from "fs";
import YAML from "yaml";
import path from "path";
import dotenv, { config } from "dotenv";
import { NodeHtmlMarkdown } from "node-html-markdown";
import {
  isDirectory,
  readFileWithFallback,
  readJsonFromFile,
} from "./helpers/file-helper.js";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);
dotenv.config();

export async function generateTranslationFiles(configData) {
  const locales = configData.locales;
  // Loop through locales
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i];

    generateTranslationFilesForLocale(locale, configData).catch((err) => {
      console.error(`❌❌ Encountered an error translating ${locale}:`, err);
    });
  }
}

async function generateTranslationFilesForLocale(locale, configData) {
  // Get the Rosey generated data
  const baseURL = configData.base_url;
  const inputFilePath = configData.rosey_paths.rosey_base_file_path;
  const inputURLFilePath = configData.rosey_paths.rosey_base_urls_file_path;
  const translationFilesDirPath = configData.rosey_paths.translations_dir_path;
  const incomingSmartlingTranslationsDir =
    configData.smartling.incoming_translations_dir;
  const smartlingTranslationsDataFilePath = path.join(
    incomingSmartlingTranslationsDir,
    `${locale}.json`
  );

  const inputFileData = await readJsonFromFile(inputFilePath);
  const inputURLFileData = await readJsonFromFile(inputURLFilePath);
  const smartlingTranslationData = await readJsonFromFile(
    smartlingTranslationsDataFilePath
  );

  const pages = Object.keys(inputURLFileData.keys);

  const translationsLocalePath = path.join(translationFilesDirPath, locale);

  console.log(`📂📂 ${translationsLocalePath} ensuring folder exists`);
  await fs.promises.mkdir(translationsLocalePath, { recursive: true });

  const translationsFiles = await fs.promises.readdir(translationsLocalePath, {
    recursive: true,
  });

  // Remove translations pages no longer present in the base.json file
  await Promise.all(
    translationsFiles.map(async (fileNameWithExt) => {
      const filePath = path.join(translationsLocalePath, fileNameWithExt);

      if (await isDirectory(filePath)) {
        return;
      }

      const fileNameHTMLFormatted = getTranslationHTMLFilename(fileNameWithExt);

      if (!pages.includes(fileNameHTMLFormatted)) {
        console.log(
          `❌ Deleting ${fileNameHTMLFormatted}(${filePath}), since it doesn't exist in the pages in our base.json`
        );

        await fs.promises.unlink(filePath);
        console.log(`❌ ${fileNameHTMLFormatted} at ${filePath} was deleted`);
      }
    })
  );

  // Loop through the pages present in the base.json
  await Promise.all(
    pages.map(async (page) => {
      // Format the page name
      const pageName = page
        .replace("/index.html", "")
        .replace(".html", "")
        .replace("index", "home");

      // Find the page file path
      const translationFilePath = path.join(
        translationFilesDirPath,
        locale,
        `${pageName}.yaml`
      );

      let cleanedOutputFileData = {};

      // Ensure nested pages have parent folders
      const pageHasParentFolder = pageName.includes("/");
      if (pageHasParentFolder) {
        const parentFolder = pageName.substring(
          0,
          pageName.lastIndexOf("/") + 1
        );
        const parentFolderFilePath = path.join(
          translationFilesDirPath,
          locale,
          parentFolder
        );
        await fs.promises.mkdir(parentFolderFilePath, { recursive: true });
      }

      const translationFileString = await readFileWithFallback(
        translationFilePath,
        "_inputs: {}"
      );
      const translationFileData = await YAML.parse(translationFileString);

      // Create the url key
      if (translationFileData["urlTranslation"]?.length > 0) {
        cleanedOutputFileData["urlTranslation"] =
          translationFileData["urlTranslation"];
      } else {
        cleanedOutputFileData["urlTranslation"] = page;
      }

      initDefaultInputs(cleanedOutputFileData, page, locale, baseURL);

      // Loop through keys to check for changes
      // Exit early if key doesn't exist on the page we're on in the loop
      Object.keys(inputFileData.keys).forEach((inputKey) => {
        const inputTranslationObj = inputFileData.keys[inputKey];

        // If input doesn't exist on this page exit early
        if (!inputTranslationObj.pages[page]) {
          return;
        }

        // Only add the key to our output data if it still exists in base.json
        // If entry no longer exists in base.json it's original has changed
        if (translationFileData[inputKey]) {
          cleanedOutputFileData[inputKey] = translationFileData[inputKey];
        }

        // If entry doesn't exist in our output file, add it
        // Check smartling translations for the translation and add it here if it exists
        if (!cleanedOutputFileData[inputKey]) {
          if (smartlingTranslationData[inputKey]) {
            cleanedOutputFileData[inputKey] = nhm.translate(
              smartlingTranslationData[inputKey]
            );
          } else {
            cleanedOutputFileData[inputKey] = "";
          }
        }

        cleanedOutputFileData["_inputs"][inputKey] = getInputConfig(
          inputKey,
          page,
          inputTranslationObj,
          baseURL
        );

        // Add each entry to page object group depending on whether they are translated or not
        if (cleanedOutputFileData[inputKey]?.length > 0) {
          cleanedOutputFileData["_inputs"]["$"].options.groups[1].inputs.push(
            inputKey
          );
        } else {
          cleanedOutputFileData["_inputs"]["$"].options.groups[0].inputs.push(
            inputKey
          );
        }
      });

      await fs.promises.writeFile(
        translationFilePath,
        YAML.stringify(cleanedOutputFileData)
      );
      console.log("✅✅ " + translationFilePath + " updated succesfully");
    })
  );
}

function getPageString(page) {
  return page.replace(".html", "").replace("index", "");
}

function initDefaultInputs(data, page, locale, baseURL) {
  // Create the inputs obj if there is none
  if (!data["_inputs"]) {
    data["_inputs"] = {};
  }

  // Create the page input object
  if (!data["_inputs"]["$"]) {
    const pageString = getPageString(page);
    data["_inputs"]["$"] = {
      type: "object",
      comment: `[See ${pageString}](${baseURL}${pageString})`,
      options: {
        place_groups_below: false,
        groups: [
          {
            heading: `Still to translate (${locale})`,
            comment: `Text to translate on [${pageString}](${baseURL}${pageString})`,
            inputs: [],
          },
          {
            heading: `Already translated (${locale})`,
            comment: `Text already translated on [${pageString}](${baseURL}${pageString})`,
            inputs: [],
          },
        ],
      },
    };
  }
}

function formatMarkdownForComments(markdown) {
  return (
    markdown
      .trim()
      // Remove all md links
      .replaceAll(/(?:__[*#])|\[(.*?)\]\(.*?\)/gm, /$1/)
      // Remove special chars
      .replaceAll(/[&\/\\#+()$~%"*<>{}_]/gm, "")
  );
}

function getInputConfig(inputKey, page, inputTranslationObj, baseURL) {
  const untranslatedPhrase = inputTranslationObj.original.trim();
  const untranslatedPhraseMarkdown = nhm.translate(untranslatedPhrase);
  const originalPhraseTidiedForComment = formatMarkdownForComments(
    untranslatedPhraseMarkdown
  );

  const isKeyMarkdown = inputKey.slice(0, 10).includes("markdown:");
  const isInputShortText = untranslatedPhrase.length < 20;

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

  const locationString = generateLocationString(
    originalPhraseTidiedForComment,
    page,
    baseURL
  );

  const isLabelConcat = originalPhraseTidiedForComment.length > 42;

  const formattedLabel = isLabelConcat
    ? `${originalPhraseTidiedForComment.substring(0, 42)}...`
    : originalPhraseTidiedForComment;

  const inputConfig = isLabelConcat
    ? {
        label: formattedLabel,
        hidden: untranslatedPhrase === "" ? true : false,
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
        hidden: untranslatedPhrase === "" ? true : false,
        type: inputType,
        options: options,
        comment: locationString,
      };

  return inputConfig;
}

function getTranslationHTMLFilename(translationFilename) {
  if (translationFilename === "404.yaml") {
    return "404.html";
  }

  if (translationFilename === "home.yaml") {
    return "index.html";
  }

  return translationFilename.replace(".yaml", "/index.html");
}

function generateLocationString(originalPhrase, page, baseURL) {
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
    } else {
      startHighlightArrayWithoutPunctuation.push(word);
    }
  }

  for (let j = 0; j < endHighlightArrayWithPunctuation.length; j++) {
    const word = endHighlightArrayWithPunctuation[j];
    const foundMatches = word.match(regexToMatch);
    if (foundMatches && foundMatches.length > 0) {
      endHighlightArrayWithoutPunctuation.push(
        word.replaceAll(regexToMatch, "")
      );
      break;
    } else {
      endHighlightArrayWithoutPunctuation.push(word);
    }
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
    ? `[See on page](${baseURL}${pageString}#:~:text=${encodedStartHighlight},${encodedEndHighlight})`
    : `[See on page](${baseURL}${pageString}#:~:text=${encodedOriginalPhrase})`;
}
