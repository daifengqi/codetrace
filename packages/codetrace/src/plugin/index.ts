import { Plugins } from "../types";

export function pluginHandler(collectedFiles: string[], plugins: Plugins) {
  for (const fn of plugins) {
    fn(collectedFiles);
  }
}
