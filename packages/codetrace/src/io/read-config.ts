import path from "path";
import { traceConfigJs } from "../constants";
import { Config } from "../types";
import { error_log } from "../utils/cli";

export function readConfig(): Config {
  try {
    const config = require(path.resolve(process.cwd(), traceConfigJs));
    return config;
  } catch (e) {
    error_log(e);
  }
}
