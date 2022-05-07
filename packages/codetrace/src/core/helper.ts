import * as fs from "fs";
import path from "path";
import { Config, Params } from "../types";
import { isAlias, removeLastFile, replaceAlias } from "../utils";
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

export function initConfig(props: { config: Config; params?: Params }) {
  const { config, params } = props;
  const {
    entry,
    packageJsonPath = [],
    include = [],
    endDir = [],
    extensions = ["js", "ts", "jsx", "tsx"],
    alias = {},
    verbose = false,
    files = [],
  } = config;

  if (params?.diff_files) {
    files.push(...params.diff_files);
  }

  return {
    entry,
    packageJsonPath,
    include,
    endDir,
    extensions,
    alias,
    verbose,
    files,
  };
}

export function initVariables() {
  return {
    deps: new Map<string, string[]>(),
    cdeps: new Map<string, string[]>(), // converted Deps
    visited: new Set<string>(),
    fileAffected: new Set<string>(),
    fileCollectedAffected: new Set<string>(),
  };
}

export function isSelfModules(importedPath: string, includePkgs: string[]) {
  for (const pkgName of includePkgs) {
    if (importedPath.startsWith(pkgName)) {
      return true;
    }
  }
  return false;
}

export function initNodeModuleDeps(props: {
  packageJsonPath: string[];
  includePackages: string[];
}) {
  const nodeModuleDeps = new Set<string>();
  const { packageJsonPath, includePackages } = props;
  packageJsonPath.forEach((path) => {
    const pkgJson = JSON.parse(fs.readFileSync(`./${path}`).toString());

    Object.keys(pkgJson.dependencies || []).forEach((dep) => {
      if (!isSelfModules(dep, includePackages)) {
        nodeModuleDeps.add(dep);
      }
    });

    Object.keys(pkgJson.devDependencies || []).forEach((dep) => {
      if (!isSelfModules(dep, includePackages)) {
        nodeModuleDeps.add(dep);
      }
    });
  });

  return nodeModuleDeps;
}

export function isNodeModuleDeps(props: {
  filePath: string;
  nodeModuleDeps: string[] | Set<string>;
}) {
  const { filePath, nodeModuleDeps } = props;
  return [...nodeModuleDeps].some((name) => filePath.startsWith(name));
}

export function processImportModule(props: {
  filePath: string;
  astValue: string;
  nodeModuleDeps: Set<string>;
  alias: Record<string, string>;
}) {
  const { filePath, astValue, nodeModuleDeps, alias } = props;
  if (!astValue) {
    return;
  }

  if (
    isNodeModuleDeps({
      filePath,
      nodeModuleDeps,
    })
  ) {
    return;
  }

  if (isAlias(astValue, alias)) {
    /** absolute path */
    return replaceAlias(astValue, alias);
  }

  /** relative path */
  return path.join(removeLastFile(filePath), astValue);
}

export function existValidFile(props: {
  filePath: string;
  extensions: string[];
}) {
  const { filePath, extensions } = props;
  return (
    fs.existsSync(filePath) &&
    fs.statSync(filePath).isFile() &&
    extensions.some((ext) => filePath.endsWith(ext))
  );
}

export function getPossiblePaths(props: {
  filePath: string;
  extensions: string[];
}) {
  const { filePath, extensions } = props;
  const possiblePaths = [];
  if (existValidFile({ filePath, extensions })) {
    possiblePaths.push(filePath);
  }

  for (const ext of extensions) {
    const FilePathExt = `${filePath}.${ext}`;
    if (existValidFile({ filePath: FilePathExt, extensions })) {
      possiblePaths.push(FilePathExt);
    }
  }

  const sep = path.sep;

  for (const ext of extensions.map((ext) => `${sep}index.${ext}`)) {
    const FilePathExt = filePath + ext;
    if (existValidFile({ filePath: FilePathExt, extensions })) {
      possiblePaths.push(FilePathExt);
    }
  }

  return possiblePaths;
}

export function findDeps(props: {
  filePath: string;
  nodeModuleDeps: Set<string>;
  alias: Record<string, string>;
}) {
  const { filePath, nodeModuleDeps, alias } = props;
  const currentFilePath = path.join("", filePath);

  const importList: string[] = [];
  const content = fs.readFileSync(currentFilePath, { encoding: "utf-8" });

  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "dynamicImport", "classProperties"],
  });

  traverse(ast, {
    ImportDeclaration({ node }) {
      importList.push(
        processImportModule({
          filePath,
          astValue: node.source.value,
          nodeModuleDeps,
          alias,
        })
      );
    },
    ExportAllDeclaration({ node }) {
      if (!node.source) {
        return;
      }
      importList.push(
        processImportModule({
          filePath,
          astValue: node.source.value,
          nodeModuleDeps,
          alias,
        })
      );
    },
    ExportNamedDeclaration({ node }) {
      if (!node.source) {
        return;
      }
      importList.push(
        processImportModule({
          filePath,
          astValue: node.source.value,
          nodeModuleDeps,
          alias,
        })
      );
    },
    CallExpression({ node }) {
      if (node.callee.type !== "Import") {
        return;
      }
      importList.push(
        processImportModule({
          filePath,
          astValue: node.arguments[0].value,
          nodeModuleDeps,
          alias,
        })
      );
    },
  });

  return importList.filter(Boolean);
}

export function recurAddDeps(props: {
  currentFilePath: string;
  nodeModuleDeps: Set<string>;
  alias: Record<string, string>;
  extensions: string[];
  deps: Map<string, string[]>;
  visited: Set<string>;
  verbose: boolean;
}) {
  const {
    currentFilePath,
    nodeModuleDeps,
    alias,
    extensions,
    deps,
    visited,
    verbose,
  } = props;
  if (visited.has(currentFilePath)) {
    return;
  }
  visited.add(currentFilePath);

  if (verbose) {
    console.log("------ build dependency graph:", currentFilePath);
  }

  const depFiles = [];
  for (const literal of findDeps({
    filePath: currentFilePath,
    nodeModuleDeps,
    alias,
  })) {
    for (const depPath of getPossiblePaths({
      filePath: literal,
      extensions,
    })) {
      depFiles.push(depPath);
    }
  }

  deps.set(currentFilePath, depFiles);

  for (const depFile of depFiles) {
    recurAddDeps({
      currentFilePath: depFile,
      nodeModuleDeps,
      alias,
      extensions,
      deps,
      visited,
      verbose,
    });
  }
}

export function recurAddCDeps(props: {
  deps: Map<string, string[]>;
  cdeps: Map<string, string[]>;
}) {
  const { deps, cdeps } = props;
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

export function recurCollectAffected(props: {
  diffFileList: string[];
  visited: Set<string>;
  endDir: string[];
  fileAffected: Set<string>;
  cdeps: Map<string, string[]>;
}) {
  const { diffFileList, visited, endDir, fileAffected, cdeps } = props;

  for (const filePath of diffFileList) {
    if (visited.has(filePath)) {
      return;
    }
    visited.add(filePath);

    endDir.forEach((dirName) => {
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

    recurCollectAffected({
      diffFileList: parentList,
      visited,
      endDir,
      fileAffected,
      cdeps,
    });
  }
}

export function filterFilesByDirLevel(props: {
  fileAffected: string[];
  endDir: string[];
  level?: number;
}) {
  const { endDir, fileAffected, level = 1 } = props;

  const fileCollectedAffected = new Set<string>();

  for (const dirName of endDir) {
    for (const filePath of fileAffected) {
      const filePathArr = filePath.split(path.sep);
      const startIdx = filePathArr.indexOf(dirName);
      if (startIdx == -1) {
        continue;
      }
      fileCollectedAffected.add(
        filePathArr.slice(0, startIdx + 1 + level).join(path.sep)
      );
    }
  }

  return fileCollectedAffected;
}
