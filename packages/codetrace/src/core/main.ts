import { Config, Params } from "../types";

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

export function collectFile(props: { config: Config; params?: Params }) {
  const { config, params } = props;

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
    endDirs,
    fileAffected,
    cdeps,
  });

  const fileCollectedAffected = filterFilesByDirLevel({
    endDirs,
    fileAffected: [...fileAffected],
  });

  if (verbose) {
    log("Code trace result:\n ", [...fileCollectedAffected], "\n");
  }

  return [...fileCollectedAffected];
}
