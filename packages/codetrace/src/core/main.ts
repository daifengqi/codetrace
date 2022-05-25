import { resolveWorkSpace } from "../io/read-workspace";
import { writeDeps } from "../io/write-deps";
import { Config, Handlers, Params } from "../types";
import { RepoInfo } from "../types/file";
import { success_log } from "../utils/cli";

import {
  filterFilesByDirLevel,
  initConfig,
  initNodeModuleDeps,
  initVariables,
  recurInvertDeps,
  recurTraceDeps,
  recurCollectFiles,
} from "./helper";
import { resolveNpmChanges } from "./pkgjson";

export function main(props: {
  config: Config;
  params?: Params;
  handlers?: Handlers[];
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

  // const nodeModuleDeps = initNodeModuleDeps({
  //   packageJsonPath,
  //   includePackages,
  // });

  const repoInfos: RepoInfo[] = resolveWorkSpace();

  // trace deps
  recurTraceDeps({
    currentFilePath: entry,
    alias,
    extensions,
    deps,
    visited,
    repoInfos,
  });

  // convert deps
  visited.clear();
  recurInvertDeps({
    deps,
    cdeps,
  });

  // store deps and cdeps
  writeDeps({
    deps,
    cdeps,
  });

  // collect
  visited.clear();
  const npmChanges = resolveNpmChanges(repoInfos);

  recurCollectFiles({
    diffFileList: [...files, ...npmChanges], // add npm dependency changes
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
