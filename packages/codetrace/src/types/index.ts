export type Config = {
  entry: string;
  endDirs: string[];
  packageJsonPath?: string[];
  include?: string[];
  extensions?: string[];
  alias?: Record<string, string>;
  files?: string[];
  verbose?: boolean;
  plugins?: Plugins;
};

export type Params = {
  diff_files?: string[];
};

export type Plugin = (options: any) => (files: string[]) => void;

export type Plugins = Plugin[];
