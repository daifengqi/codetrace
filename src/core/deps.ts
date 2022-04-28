import fs from "fs";
import path from "path";
import { readConfig } from "../config/read";
import { isAlias, isSelfModules, removeLastFile, replaceAlias } from "../utils";
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

export function run(opt?: { diffFiles?: string[] }) {
  const config = readConfig();
  const { log } = console;
  log(config);

  /** Static variables */
  const ENTRY = config.entry;
  const PKG_JSON_LOCATION = ["package.json", ...(config.packageJsonPath || [])];
  const SELF_PACKAGES = config.includeDep || [];
  const FINAL_DIR = config.sourceDir || [];
  const possibleExtensions = config.extensions || ["js", "ts", "jsx", "tsx"];
  const aliasReplace = config.aliasReplace || {};
  // priority: option > config
  const diffFiles = opt?.diffFiles ? opt.diffFiles : config.diffFiles || [];
  const showLogs = config.showLogs || false;

  log({ diffFiles });

  /** runtime variables */
  const deps = new Map();
  const cdeps = new Map(); // converted Deps
  const visited = new Set();
  const cvisited = new Set();
  const nodeModuleDeps = new Set();
  const fileAffected = new Set<string>();
  const fileCollectedAffected = new Set();

  function initNodeModuleDeps() {
    PKG_JSON_LOCATION.forEach((path) => {
      const pkgJson = JSON.parse(fs.readFileSync(`./${path}`).toString());

      Object.keys(pkgJson.dependencies || []).forEach((dep) => {
        if (!isSelfModules(dep, SELF_PACKAGES)) {
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

    if (isAlias(value, aliasReplace)) {
      /** absolute path */
      return replaceAlias(value, aliasReplace);
    }

    /** relative path */
    return path.join(removeLastFile(filePath), value);
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
      const FilePathExt = `${filePath}.${ext}`;
      if (existValidFile(FilePathExt)) {
        possiblePaths.push(FilePathExt);
      }
    }

    const sep = path.sep;

    for (const ext of possibleExtensions.map((ext) => `${sep}index.${ext}`)) {
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
      log("------ build dependency graph:", currentFilePath);
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

  function addFinalAffected(diffFiles: string[]) {
    for (const filePath of diffFiles) {
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
        // next file
        continue;
      }

      addFinalAffected(parentList);
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

  initAllDeps();
  addFinalAffected(diffFiles);
  retainOneDirLevel();

  log("Code trace result: ", [...fileCollectedAffected]);
  return [...fileCollectedAffected];
}
