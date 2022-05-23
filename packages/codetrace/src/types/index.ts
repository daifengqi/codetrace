type TargetDirsHandlerPlugin = (dirs: string[]) => void;

export type PluginHandler = TargetDirsHandlerPlugin;

export type Handlers = {
  targetDirHandler?: TargetDirsHandlerPlugin;
};

export type Config = {
  entry: string;
  endDirs: string[];
  packageJsonPath?: string[];
  include?: string[];
  extensions?: string[];
  alias?: Record<string, string>;
  files?: string[];
  verbose?: boolean;
  plugins?: Handlers[];
};

export type Params = {
  diff_files?: string[];
};
