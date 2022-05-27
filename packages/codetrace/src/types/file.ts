export type DepMap = Map<string, string[]>;

export type PkgJSON = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
};

type WorkSpace = string;
type RepoName = string;
export type FilePath = string;
export type DirPath = string;

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
