export type DepType = Map<string, string[]>;

export type PkgJSON = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
};
