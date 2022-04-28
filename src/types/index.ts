export type Config = {
  entry: string;
  targetDir: string[];
  packageJsonPath?: string[];
  includeDep?: string[];
  extensions?: string[];
  aliasReplace?: Record<string, string>;
  diffFiles?: string[];
  showLogs?: boolean;
};
