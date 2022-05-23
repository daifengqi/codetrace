import * as fs from "fs";
import { cdepsJson, depsJson } from "../constants";
import { existFile } from "../utils";
import { error_log } from "../utils/cli";

export function showTraceResult(files: string[]) {
  if (!existFile(depsJson) || !existFile(cdepsJson)) {
    error_log("You should have run `npx trace` or `npx trace -g` before.");
    return;
  }
}
