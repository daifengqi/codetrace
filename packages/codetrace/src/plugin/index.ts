import { Plugin } from "../types";

export function pluginHandler(
  collectedFiles: string[],
  fns: Array<ReturnType<Plugin>>
) {
  for (const fn of fns) {
    fn(collectedFiles);
  }
}
