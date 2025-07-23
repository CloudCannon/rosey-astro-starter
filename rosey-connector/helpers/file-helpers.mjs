import fs from "fs";
import YAML from "yaml";
import path from "path";
import slugify from "slugify";

async function isDirectory(filePath) {
  const stat = await fs.promises.stat(filePath);

  return stat.isDirectory();
}

function handleConfigPaths(pathString) {
  if (!pathString) {
    return "";
  }

  const splitPathArr = pathString.split("/");

  let pathToReturn = "";
  for (const pathSegment of splitPathArr) {
    pathToReturn = path.join(pathToReturn, pathSegment);
  }
  return pathToReturn;
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

async function readTranslationFile(filepath) {
  const translationFileRaw = await readFileWithFallback(
    filepath,
    "_inputs: {}"
  );
  return YAML.parse(translationFileRaw);
}

// Not used but keeping just in case
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

function getTranslationHtmlFilename(
  translationFilename,
  baseUrlFileData,
  namespaceArray
) {
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

  // Before throwing a log check that the file doesn't exist, and check that it's not in our namespace arr
  // We will still return an empty string as the fileName, as its used for urlTranslations check
  // But no need to log a warning if its in ns arr as it makes sense there's no .html file for ns pages
  if (
    !fileName &&
    !namespaceArray?.includes(translationFilename.replace(".yaml", ""))
  ) {
    console.log(
      `No .html filename found for ${translationFilename} in our base.urls.json`
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

  // /index.html shouldn't count as a parent dir
  const removedExtensionUrl = filePath.replace("/index.html", "");
  return filePath.substring(0, removedExtensionUrl.lastIndexOf("/") + 1);
}

function getTranslationFilePath(
  locale,
  translationsDirPath,
  translationFilename
) {
  return path.join(translationsDirPath, locale, translationFilename);
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

async function archiveOldTranslationFiles(
  translationsFiles,
  translationsLocalePath,
  baseUrlFileDataKeys,
  pages,
  namespaceArray
) {
  await Promise.all(
    translationsFiles.map(async (fileName) => {
      const filePath = path.join(translationsLocalePath, fileName);
      const currentDateTime = Date(Date.now()).toString();
      const currentDateTimeSlugified = slugify(currentDateTime);
      const localeCodeArr = translationsLocalePath.split("/");
      const localeCode = localeCodeArr[localeCodeArr.length - 1];
      // Get filename and parent dir names
      const fileNameParentDirArr = fileName.split("/");
      let parentDirName = "";
      let fileNameNoParent = "";
      if (fileNameParentDirArr.length > 1) {
        fileNameNoParent = fileNameParentDirArr.pop();
        parentDirName = fileNameParentDirArr.join("/");
      } else {
        fileNameNoParent = fileName;
      }

      // Dir and path to write to archives to
      const archivedFilesDir = path.join(
        "rosey",
        "archived",
        currentDateTimeSlugified,
        localeCode,
        "translations",
        parentDirName // Is an empty string if there are no parent dirs for the file, so resolves to nothing when joining
      );
      const archivedFilePath = path.join(archivedFilesDir, fileNameNoParent);

      // Don't archive directories
      if (await isDirectory(filePath)) {
        return;
      }

      // Don't archive namespaced pages
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

      // Get the html equivalent of the yaml file to check if it exists in base.json which deals in .html files
      const fileNameHtmlFormatted = getTranslationHtmlFilename(
        fileName,
        baseUrlFileDataKeys
      );

      // Archive the page if it no longer exists in base.json
      if (!pages.includes(fileNameHtmlFormatted)) {
        console.log(
          `🧹 Archiving translation file: ${filePath}, as it no longer exists in the pages in our base.json, or namespaced pages.`
        );

        // Create the archive dir to move the old files to
        // If the page is nested, like in a blog section, we make sure the parent dir is created as well
        await fs.promises.mkdir(archivedFilesDir, { recursive: true });

        // Move the old file to the archives
        await fs.promises.rename(filePath, archivedFilePath);
        console.log(`🧹 Translation file ${filePath} was archived!`);
      }
    })
  );
}

export {
  isDirectory,
  readFileWithFallback,
  readJsonFromFile,
  readTranslationFile,
  readContentPage,
  readConfigFile,
  getTranslationHtmlFilename,
  getYamlFileName,
  getPageString,
  createParentDirIfExists,
  archiveOldTranslationFiles,
  getTranslationFilePath,
  handleConfigPaths,
};
