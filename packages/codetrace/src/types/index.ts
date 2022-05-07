export type Config = {
  entry: string;
  endDir: string[];
  packageJsonPath?: string[];
  include?: string[];
  extensions?: string[];
  alias?: Record<string, string>;
  files?: string[];
  verbose?: boolean;
};

export type Params = {
  diff_files?: string[];
};
