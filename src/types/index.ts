export type Config = {
  entry: string;
  sourceDir: string[];
  packageJsonPath?: string[];
  includeDep?: string[];
  extensions?: string[];
  aliasReplace?: Object;
  diffFiles?: string[];
  showLogs?: boolean;
};
