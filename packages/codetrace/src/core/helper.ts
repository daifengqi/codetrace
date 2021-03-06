import * as fs from "fs";
import path from "path";
import { Config, Params } from "../types";
import { DepMap, RepoInfo } from "../types/file";
import {
  existValidFile,
  isAlias,
  removeLastFile,
  replaceAlias,
} from "../utils";
import { parsePkgJson } from "../utils/json";
import { getReposNpm, isNpm, isReposNpm } from "../utils/repo";
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

export function initConfig(props: { config: Config; params?: Params }) {
  const { config, params } = props;
  const {
    entry,
    packageJsonPath = [],
    include = [],
    endDirs = [],
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
    endDirs,
    extensions,
    alias,
    verbose,
    files,
  };
}

export function initVariables() {
  return {
    deps: new Map<string, string[]>() as DepMap,
    cdeps: new Map<string, string[]>() as DepMap, // converted Deps
    visited: new Set<string>(),
    targetFilesSet: new Set<string>(),
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
    const pkgJson = parsePkgJson(fs.readFileSync(`./${path}`).toString());

    Object.keys(pkgJson.dependencies || []).forEach((dep) => {
      if (!isSelfModules(dep, includePackages)) {
        nodeModuleDeps.add(dep);
      }
    });
  });

  return nodeModuleDeps;
}

// function isNodeModuleDeps(props: {
//   filePath: string;
//   nodeModuleDeps: string[] | Set<string>;
// }) {
//   const { filePath, nodeModuleDeps } = props;
//   return [...nodeModuleDeps].some((name) => filePath.startsWith(name));
// }

export function processImportModule(props: {
  filePath: string;
  astValue: string;
  alias: Record<string, string>;
  npmPackages: string[];
  repoPath: string;
}) {
  const { filePath, astValue, alias, npmPackages, repoPath } = props;

  if (!astValue) {
    return;
  }

  if (isAlias(astValue, alias)) {
    /** absolute path */
    return replaceAlias(astValue, alias);
  }

  /** third party dependencies */
  if (
    isNpm({
      library: astValue,
      npmPackages,
    })
  ) {
    return getReposNpm(repoPath, astValue);
  }

  /** relative path */
  return path.join(removeLastFile(filePath), astValue);
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
  alias: Record<string, string>;
  repoInfo?: RepoInfo;
}) {
  const { filePath, alias, repoInfo } = props;
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
          alias,
          npmPackages: repoInfo.dependencies.npmPackages,
          repoPath: repoInfo.path,
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
          alias,
          npmPackages: repoInfo.dependencies.npmPackages,
          repoPath: repoInfo.path,
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
          alias,
          npmPackages: repoInfo.dependencies.npmPackages,
          repoPath: repoInfo.path,
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
          alias,
          npmPackages: repoInfo.dependencies.npmPackages,
          repoPath: repoInfo.path,
        })
      );
    },
  });

  return importList.filter(Boolean);
}

export function recurTraceDeps(props: {
  currentFilePath: string;
  alias: Record<string, string>;
  extensions: string[];
  deps: DepMap;
  visited: Set<string>;
  repoInfos?: RepoInfo[];
}) {
  const { currentFilePath, alias, extensions, deps, visited, repoInfos } =
    props;
  if (visited.has(currentFilePath)) {
    return;
  }
  visited.add(currentFilePath);

  const depFiles = [];
  const depNpms = [];

  for (const literal of findDeps({
    filePath: currentFilePath,
    alias,
    repoInfo: repoInfos.find((repo) => currentFilePath.includes(repo.path)),
  })) {
    const localDeps = getPossiblePaths({
      filePath: literal,
      extensions,
    });

    for (const depPath of localDeps) {
      depFiles.push(depPath);
    }

    if (isReposNpm(literal)) {
      depNpms.push(literal);
    }
  }

  deps.set(currentFilePath, [...depFiles, ...depNpms]);

  for (const depFile of depFiles) {
    recurTraceDeps({
      currentFilePath: depFile, // only set depFile, npm packages should not trace
      alias,
      extensions,
      deps,
      visited,
      repoInfos,
    });
  }
}

export function recurInvertDeps(props: { deps: DepMap; cdeps: DepMap }) {
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

export function hitTarget(props: { filePath: string; endDirs: string[] }) {
  const { filePath, endDirs } = props;
  const { sep } = path;

  for (const dirName of endDirs) {
    if (filePath.indexOf(`${sep}${dirName}${sep}`) !== -1) {
      return true;
    }
  }

  return false;
}

export function recurCollectFiles(props: {
  diffFileList: string[];
  visited: Set<string>;
  endDirs: string[];
  targetFilesSet: Set<string>;
  cdeps: DepMap;
}) {
  const { diffFileList, visited, endDirs, targetFilesSet, cdeps } = props;

  for (const filePath of diffFileList) {
    if (visited.has(filePath)) {
      return;
    }
    visited.add(filePath);

    if (hitTarget({ filePath, endDirs })) {
      targetFilesSet.add(filePath);
    }

    const parentList = cdeps.get(filePath);

    if (!parentList) {
      // next file
      continue;
    }

    recurCollectFiles({
      diffFileList: parentList,
      visited,
      endDirs,
      targetFilesSet,
      cdeps,
    });
  }
}

export function filterFilesByDirLevel(props: {
  targetFiles: string[];
  endDirs: string[];
  level?: number;
}) {
  const { endDirs, targetFiles, level = 1 } = props;

  const fileCollectedAffected = new Set<string>();

  for (const dirName of endDirs) {
    for (const filePath of targetFiles) {
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
