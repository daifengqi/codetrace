import fs, { readFileSync } from "fs";
import { existFile, existFolder, removeLastFile } from "../utils";
import yaml from "yaml";
import { DependencyType, PkgJSON, RepoInfo, YamlType } from "../types/file";
import { getCurrentPkgJsonPath } from "../core/pkgjson";
import { parsePkgJson } from "../utils/json";
import path from "path";

export function readWorkSpace() {
  if (!existFile("pnpm-workspace.yaml") && !existFile("pnpm-workspace.yml")) {
    return;
  }

  let content: string | undefined;

  if (existFile("pnpm-workspace.yaml")) {
    content = readFileSync("pnpm-workspace.yaml", "utf-8");
  } else {
    content = readFileSync("pnpm-workspace.yml", "utf-8");
  }

  return content;
}

function getDirs(dirPath: string) {
  return fs
    .readdirSync(dirPath)
    .filter((dir) => existFolder(path.join(dirPath, dir)))
    .map((dir) => path.join(dirPath, dir));
}

function resolveDependency(pkgJson: PkgJSON) {
  const dependenciesArr = [
    ...Object.entries(pkgJson.dependencies || {}),
    ...Object.entries(pkgJson.devDependencies || {}),
    ...Object.entries(pkgJson.resolutions || {}),
  ];

  const dependencies = dependenciesArr.map(([name, version]) => {
    return {
      name,
      version,
      type: version.startsWith("workspace")
        ? DependencyType.Cross_Repo
        : DependencyType.Npm,
    };
  });

  return {
    npmPackages: dependencies
      .filter((d) => d.type === DependencyType.Npm)
      .map((d) => d.name),
    repoPackages: dependencies
      .filter((d) => d.type === DependencyType.Cross_Repo)
      .map((d) => d.name),
  };
}

function getRepoInfo(workspaces: string[]) {
  const repoinfo: RepoInfo[] = [];

  for (const workspace of workspaces) {
    const repos = getDirs(workspace);

    for (const repo of repos) {
      const pkgJsonPath = getCurrentPkgJsonPath(repo);

      if (!existFile(pkgJsonPath)) {
        continue;
      }

      const pkgJson = parsePkgJson(readFileSync(pkgJsonPath, "utf-8"));

      const { npmPackages, repoPackages } = resolveDependency(pkgJson);

      repoinfo.push({
        name: pkgJson.name,
        path: repo,
        dependencies: {
          npmPackages,
          repoPackages,
        },
      });
    }
  }

  return repoinfo;
}

export function resolveWorkSpace() {
  const content = readWorkSpace();

  if (!content) {
    return;
  }

  const yamlObject = yaml.parse(content) as YamlType;
  const workspaces = yamlObject.packages.map(removeLastFile);

  return getRepoInfo(workspaces);
}
