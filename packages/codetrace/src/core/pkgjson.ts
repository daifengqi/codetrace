import { execSync } from "child_process";
import { fstat, readFileSync } from "fs";
import path from "path";
import { RepoInfo } from "../types/file";
import { existFile, existFolder } from "../utils";
import { parsePkgJson } from "../utils/json";
import { getReposNpm } from "./helper";

function getCurrentPkgJsonPath(current: string) {
  return `${current}${path.sep}package.json`;
}

function getFirstPkgJsonContent(entry: string) {
  let current;

  if (existFile(entry)) {
    current = path.dirname(entry);
  } else if (existFolder(entry)) {
    current = entry;
  } else {
    throw new Error("Wrong path");
  }

  while (current !== path.sep) {
    const pkgJsonPath = getCurrentPkgJsonPath(current);
    if (!existFile(pkgJsonPath)) {
      continue;
    }

    return readFileSync(pkgJsonPath, "utf-8");
  }
}

function getPkgJsonChangedDeps(entry: string, level?: number) {
  let current = path.dirname(entry);
  let changedDeps = new Set<string>();

  if (!level) {
    level = 30;
  }
  if (level < 0) {
    throw new Error("Cannot search level < 0");
  }

  while (current !== path.sep) {
    const pkgJsonPath = getCurrentPkgJsonPath(current);
    if (!existFile(pkgJsonPath)) {
      continue;
    }

    getPkgJsonDiff(pkgJsonPath).forEach((dep) => {
      changedDeps.add(dep);
    });

    current = path.dirname(current);

    // control search upwards how many times to find package.json
    if (level == 0) {
      break;
    }
    level -= 1;
  }

  return changedDeps;
}

function findDiffSet(arr1: string[], arr2: string[]) {
  return arr1.concat(arr2).filter(
    (v) =>
      // add
      (arr1.includes(v) && !arr2.includes(v)) ||
      // remove
      (!arr1.includes(v) && arr2.includes(v)) ||
      // update
      (arr1.includes(v) && arr2.includes(v))
  );
}

function getPkgJsonDiff(pkgJsonPath: string) {
  const oldFile = execSync(`git show HEAD:${pkgJsonPath}`, {
    encoding: "utf-8",
  });
  const newFile = readFileSync(pkgJsonPath, "utf-8");

  const oldDeps = Object.keys(parsePkgJson(oldFile)?.dependencies || {});
  const newDeps = Object.keys(parsePkgJson(newFile)?.dependencies || {});

  return findDiffSet(oldDeps, newDeps);
}

export function resolveNpmChanges(repoInfos: RepoInfo[]) {
  const npmChanges: string[] = [];

  for (const repo of repoInfos) {
    const pkgJsonPath = path.join(repo.path, "package.json");
    const diffNpmPackags = getPkgJsonDiff(pkgJsonPath);

    for (const pkg of diffNpmPackags) {
      npmChanges.push(getReposNpm(repo.path, pkg));
    }
  }

  return npmChanges;
}
