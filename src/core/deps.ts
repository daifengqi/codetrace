import fs from "fs";
import path from "path";

import { config } from "../config/read";

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const { log } = console;
log(config);

/** Static variables */
const ENTRY = config.entry;
const PKG_JSON_LOCATION = config.packageJsonPath;
const SELF_PACKAGES = config.exclude;
const FINAL_DIR = config.outputDir;
const possibleExtensions = config.extensions;
const aliasReplace = config.aliasReplace;
const diffFiles = config.diffFiles;
const showLogs = config.showLogs;

/** runtime variables */
const deps = new Map();
const cdeps = new Map(); // converted Deps
const visited = new Set();
const cvisited = new Set();
const nodeModuleDeps = new Set();
const fileAffected = new Set<string>();
const fileCollectedAffected = new Set();

/** Functions */
function isAlias(filePath) {
  for (const key of Object.keys(aliasReplace)) {
    if (filePath.startsWith(key)) {
      return true;
    }
  }
  return false;
}

function replaceAlias(filePath) {
  Object.keys(aliasReplace).forEach((key) => {
    if (filePath.startsWith(key)) {
      filePath = filePath.replace(key, aliasReplace[key]);
    }
  });
  return filePath;
}

function isSelfModules(name) {
  for (const mod of SELF_PACKAGES) {
    if (name.startsWith(mod)) {
      return true;
    }
  }
  return false;
}

function initNodeModuleDeps() {
  PKG_JSON_LOCATION.forEach((path) => {
    const pkgJson = JSON.parse(fs.readFileSync(`./${path}`).toString());

    Object.keys(pkgJson.dependencies).forEach((dep) => {
      if (!isSelfModules(dep)) {
        nodeModuleDeps.add(dep);
      }
    });
  });
}

function isNodeModuleDeps(filePath) {
  return [...nodeModuleDeps].some((name) => filePath.startsWith(name));
}

function processImportModule(filePath, value) {
  if (!value) {
    return;
  }

  if (isNodeModuleDeps(value)) {
    return;
  }

  if (isAlias(value)) {
    /** absolute path */
    return replaceAlias(value);
  }

  /** relative path */
  return path.join(removeLastFile(filePath), value);
}

function removeLastFile(filePath) {
  return filePath.substring(0, filePath.lastIndexOf("/"));
}

function existValidFile(filePath) {
  return (
    fs.existsSync(filePath) &&
    fs.statSync(filePath).isFile() &&
    possibleExtensions.some((ext) => filePath.endsWith(ext))
  );
}

function getPossiblePaths(filePath) {
  const possiblePaths = [];
  if (existValidFile(filePath)) {
    possiblePaths.push(filePath);
  }

  for (const ext of possibleExtensions) {
    const FilePathExt = filePath + ext;
    if (existValidFile(FilePathExt)) {
      possiblePaths.push(FilePathExt);
    }
  }

  const sep = path.sep;

  for (const ext of possibleExtensions.map((ext) => `${sep}index${ext}`)) {
    const FilePathExt = filePath + ext;
    if (existValidFile(FilePathExt)) {
      possiblePaths.push(FilePathExt);
    }
  }

  return possiblePaths;
}

function findDeps(filePath) {
  const currentFilePath = path.join("", filePath);

  const importList = [];
  // TODO: fix ByteSec problem
  const content = fs.readFileSync(currentFilePath, { encoding: "utf-8" });

  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "dynamicImport", "classProperties"],
  });

  traverse(ast, {
    ImportDeclaration({ node }) {
      importList.push(processImportModule(filePath, node.source.value));
    },
    ExportAllDeclaration({ node }) {
      if (!node.source) {
        return;
      }
      importList.push(processImportModule(filePath, node.source.value));
    },
    ExportNamedDeclaration({ node }) {
      if (!node.source) {
        return;
      }
      importList.push(processImportModule(filePath, node.source.value));
    },
    CallExpression({ node }) {
      if (node.callee.type !== "Import") {
        return;
      }
      importList.push(processImportModule(filePath, node.arguments[0].value));
    },
  });

  return importList.filter(Boolean);
}

function recurAddDeps(filePath) {
  const currentFilePath = filePath;

  if (visited.has(currentFilePath)) {
    return;
  }
  visited.add(currentFilePath);
  if (showLogs) {
    log("------ goto file:", currentFilePath);
  }

  const depFiles = [];
  for (const literal of findDeps(currentFilePath)) {
    for (const depPath of getPossiblePaths(literal)) {
      depFiles.push(depPath);
    }
  }

  deps.set(currentFilePath, depFiles);

  for (const depFile of depFiles) {
    recurAddDeps(depFile);
  }
}

function recurAddCDeps() {
  for (const [file, depFiles] of deps.entries()) {
    for (const depFile of depFiles) {
      if (cdeps.has(depFile)) {
        cdeps.get(depFile).push(file);
      } else {
        cdeps.set(depFile, [file]);
      }
    }
  }
}

function addFinalAffected(filePath) {
  if (cvisited.has(filePath)) {
    return;
  }
  cvisited.add(filePath);

  FINAL_DIR.forEach((dirName) => {
    const sep = path.sep;
    if (filePath.indexOf(`${sep}${dirName}${sep}`) !== -1) {
      fileAffected.add(filePath);
    }
  });

  const parentList = cdeps.get(filePath);
  if (!parentList) {
    return;
  }

  for (const file of parentList) {
    if (file) {
      addFinalAffected(file);
    }
  }
}

function retainOneDirLevel() {
  for (const dirName of FINAL_DIR) {
    for (let filePath of fileAffected) {
      const filePathArr = filePath.split(path.sep);
      const startIdx = filePathArr.indexOf(dirName);
      if (startIdx == -1) {
        continue;
      }
      fileCollectedAffected.add(
        filePathArr.slice(0, startIdx + 2).join(path.sep)
      );
    }
  }
}

function initAllDeps() {
  initNodeModuleDeps();
  // add dependents
  recurAddDeps(ENTRY);
  // add converted dependents
  recurAddCDeps();
}

export function run() {
  initAllDeps();
  for (const file of diffFiles) {
    addFinalAffected(file);
  }
  retainOneDirLevel();
  log(fileCollectedAffected);
}
