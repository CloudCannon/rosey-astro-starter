import fs from "fs";
import YAML from "yaml";
import path from "path";

async function isDirectory(filepath) {
  const stat = await fs.promises.stat(filepath);

  return stat.isDirectory();
}

async function readFileWithFallback(filepath, fallbackString) {
  try {
    const buffer = await fs.promises.readFile(filepath);
    return buffer.toString("utf-8") || fallbackString;
  } catch (err) {
    if (err.code === "ENOENT") {
      return fallbackString;
    }
    console.log(`Error reading ${filepath}`);
    throw err;
  }
}

async function readJsonFromFile(filepath) {
  const contents = await readFileWithFallback(filepath, "{}");
  return JSON.parse(contents);
}

async function readYamlFromFile(filepath) {
  const translationFileRaw = await readFileWithFallback(
    filepath,
    "_inputs: {}"
  );
  return YAML.parse(translationFileRaw);
}

async function readContentPage(filePath) {
  if (!filePath) {
    console.log("No filepath provided");
    return;
  }
  const buffer = await fs.promises.readFile(filePath);
  const fileData = buffer.toString("utf-8");
  const [emptySpace, frontmatter, ...restOfPage] = fileData.split("---");
  const fileDataFrontMatterString = frontmatter;
  // Allow for <hr> in body content which is represented by '---' in markdown and ruins our split
  const fileDataBodyContent =
    restOfPage.length === 1 ? restOfPage[0] : restOfPage.join("---");
  const fileFrontMatter = YAML.parse(fileDataFrontMatterString);

  return {
    frontmatter: fileFrontMatter,
    bodyContent: fileDataBodyContent,
  };
}

async function readConfigFile(configFilePath) {
  const buffer = await fs.promises.readFile(configFilePath);
  const fileData = buffer.toString("utf-8");
  const configData = YAML.parse(fileData);
  return configData;
}

function getTranslationHtmlFilename(translationFilename, baseUrlFileData) {
  if (translationFilename === "home.yaml") {
    return "index.html";
  }

  const htmlFileName = translationFilename.replace(".yaml", "/index.html");
  const extensionlessHtmlFileName = translationFilename.replace(
    ".yaml",
    ".html"
  );

  const baseUrlFileDataKeys = Object.keys(baseUrlFileData);

  // Check whether the filename is filename.html or filename/index.html
  let fileName = "";
  if (baseUrlFileDataKeys.includes(htmlFileName)) {
    fileName = htmlFileName;
  }
  if (baseUrlFileDataKeys.includes(extensionlessHtmlFileName)) {
    fileName = extensionlessHtmlFileName;
  }

  if (!fileName) {
    console.log(
      `No .html filename found in our base.urls.json for ${translationFilename}`
    );
  }

  return fileName;
}

function getYamlFileName(fileName) {
  if (!fileName) {
    return "";
  }
  return fileName
    .replace("/index.html", ".yaml")
    .replace(".html", ".yaml")
    .replace("index", "home");
}

function getPageString(page) {
  if (page === "index.html") {
    return page;
  }
  return page.replace(".html", "").replace("index", "");
}

function getParentDirName(filePath) {
  if (!filePath) {
    return "";
  }

  return filePath.substring(0, filePath.lastIndexOf("/") + 1);
}

async function createParentDirIfExists(
  pageName,
  translationFilesDirPath,
  locale
) {
  const pageHasParentDir = pageName.includes("/");
  if (pageHasParentDir) {
    const parentDirName = getParentDirName(pageName);
    const parentDirFilePath = path.join(
      translationFilesDirPath,
      locale,
      parentDirName
    );
    await fs.promises.mkdir(parentDirFilePath, { recursive: true });
  }
}

async function removeOldTranslationFiles(
  translationsFiles,
  translationsLocalePath,
  baseUrlFileDataKeys,
  pages,
  namespaceArray
) {
  await Promise.all(
    translationsFiles.map(async (fileName) => {
      const filePath = path.join(translationsLocalePath, fileName);

      if (await isDirectory(filePath)) {
        return;
      }

      let isFilePathNamespace = false;
      for (const namespace of namespaceArray) {
        if (filePath.endsWith(`${namespace}.yaml`)) {
          isFilePathNamespace = true;
          break;
        }
      }
      if (isFilePathNamespace) {
        return;
      }

      const fileNameHtmlFormatted = getTranslationHtmlFilename(
        fileName,
        baseUrlFileDataKeys
      );

      if (!pages.includes(fileNameHtmlFormatted)) {
        console.log(
          `🧹 The page ${filePath} doesn't exist in the pages in our base.json - deleting!`
        );

        await fs.promises.unlink(filePath);
        console.log(`🧹 Translation file ${filePath} was deleted!`);
      }
    })
  );
}

export {
  isDirectory,
  readFileWithFallback,
  readJsonFromFile,
  readYamlFromFile,
  readContentPage,
  readConfigFile,
  getTranslationHtmlFilename,
  getYamlFileName,
  getPageString,
  createParentDirIfExists,
  removeOldTranslationFiles,
};
