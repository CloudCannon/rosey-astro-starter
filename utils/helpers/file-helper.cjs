const fs = require('fs');
async function readFileWithFallback(filepath, fallbackString) {
  try {
    const buffer = await fs.promises.readFile(filepath);
    return buffer.toString('utf-8') || fallbackString;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fallbackString;
    }
    throw err;
  }
}

async function readJsonFromFile(filepath) {
  const contents = await readFileWithFallback(filepath, '{}');
  return JSON.parse(contents);
}

async function isDirectory(filepath) {
  const stat = await fs.promises.stat(filepath);

  return stat.isDirectory();
}

module.exports = {
  readFileWithFallback,
  readJsonFromFile,
  isDirectory,
};
