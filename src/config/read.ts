import path from "path";
import { traceConfigJs } from "../constants";

type Config = {
  entry: string;
  sourceDir: string[];
  packageJsonPath?: string[];
  includeDep?: string[];
  extensions?: string[];
  aliasReplace?: Object;
  diffFiles?: string[];
  showLogs?: boolean;
};

export function readConfig(): Config {
  return require(path.resolve(process.cwd(), traceConfigJs));
}
