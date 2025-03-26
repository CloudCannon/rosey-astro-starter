import fs from "fs";
import YAML from "yaml";

async function readFileWithFallback(filepath, fallbackString) {
  try {
    const buffer = await fs.promises.readFile(filepath);
    return buffer.toString("utf-8") || fallbackString;
  } catch (err) {
    if (err.code === "ENOENT") {
      return fallbackString;
    }
    throw err;
  }
}

async function readJsonFromFile(filepath) {
  const contents = await readFileWithFallback(filepath, "{}");
  return JSON.parse(contents);
}

async function isDirectory(filepath) {
  const stat = await fs.promises.stat(filepath);

  return stat.isDirectory();
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

export {
  readFileWithFallback,
  readJsonFromFile,
  isDirectory,
  readContentPage,
  readConfigFile,
};
