import { readConfig } from "../io/read";
import { Params } from "../types";

import {
  filterFilesByDirLevel,
  initConfig,
  initNodeModuleDeps,
  initVariables,
  recurAddCDeps,
  recurAddDeps,
  recurCollectAffected,
} from "./helper";

const { log } = console;

export function collectFile(params?: Params) {
  const config = readConfig();

  const {
    entry,
    packageJsonPath,
    include: includePackages,
    endDir,
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

  // add deps
  recurAddDeps({
    currentFilePath: entry,
    nodeModuleDeps,
    alias,
    extensions,
    deps,
    visited,
    verbose,
  });

  // convert deps
  visited.clear();
  recurAddCDeps({
    deps,
    cdeps,
  });
  // collect
  visited.clear();
  recurCollectAffected({
    diffFileList: files,
    visited,
    endDir,
    fileAffected,
    cdeps,
  });

  const fileCollectedAffected = filterFilesByDirLevel({
    endDir,
    fileAffected: [...fileAffected],
  });

  log("Code trace result:\n ", [...fileCollectedAffected], "\n");
  return [...fileCollectedAffected];
}
