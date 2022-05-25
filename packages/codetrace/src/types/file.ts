export type DepType = Map<string, string[]>;

export type PkgJSON = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
};

type WorkSpace = string;
type RepoName = string;

export type SpaceMap = Record<RepoName, WorkSpace>;

export type YamlType = {
  packages: string[];
};

export type RepoInfo = {
  name: string;
  path: string;
  dependencies: {
    npmPackages: string[];
    repoPackages: string[];
  };
};

export enum DependencyType {
  Cross_Repo = "cross-repo",
  Npm = "npm",
}
