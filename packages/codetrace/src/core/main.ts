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
  handler: Handlers[];
}) {
  const { config, params, handler } = props;

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

  const { deps, cdeps, visited, fileAffected } = initVariables();

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
    fileAffected,
    cdeps,
  });

  const targetDirs = filterFilesByDirLevel({
    endDirs,
    fileAffected: [...fileAffected],
  });

  if (verbose) {
    success_log("Code trace result:\n ", [...targetDirs], "\n");
  }

  handler.forEach((h) => {
    h?.targetDirHandler([...targetDirs]);
  });

  return [...targetDirs];
}
