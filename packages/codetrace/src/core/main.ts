import { Config, Handlers, Params } from "../types";
import { success_log } from "../utils/clit";

import {
  filterFilesByDirLevel,
  initConfig,
  initNodeModuleDeps,
  initVariables,
  recurInvertDeps,
  recurTraceDeps,
  recurCollectFiles,
} from "./helper";

export function collectFile(props: {
  config: Config;
  params?: Params;
  handlers: Handlers[];
}) {
  const { config, params, handlers } = props;

  const {
    entry,
    packageJsonPath,
    include: includePackages,
    endDirs,
    extensions,
    alias,
    verbose,
    files,
  } = initConfig({ config, params });

  const { deps, cdeps, visited, targetFilesSet } = initVariables();

  const nodeModuleDeps = initNodeModuleDeps({
    packageJsonPath,
    includePackages,
  });

  // trace deps
  recurTraceDeps({
    currentFilePath: entry,
    nodeModuleDeps,
    alias,
    extensions,
    deps,
    visited,
  });

  // convert deps
  visited.clear();
  recurInvertDeps({
    deps,
    cdeps,
  });

  // collect
  visited.clear();
  recurCollectFiles({
    diffFileList: files,
    visited,
    endDirs,
    targetFilesSet,
    cdeps,
  });

  const targetDirsSet = filterFilesByDirLevel({
    endDirs,
    targetFiles: [...targetFilesSet],
  });

  const targetDirs = [...targetDirsSet];

  if (verbose) {
    success_log("Code trace result:\n ", targetDirs, "\n");
  }

  handlers.forEach((h) => {
    h?.targetDirHandler(targetDirs);
  });

  return [...targetDirs];
}
