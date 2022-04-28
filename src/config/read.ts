import path from "path";
import { traceConfigJs } from "../constants";
import { Config } from "../types";

export function readConfig(): Config {
  return require(path.resolve(process.cwd(), traceConfigJs));
}
