import { PkgJSON } from "../types/file";

export function parsePkgJson(text: string) {
  return JSON.parse(text) as PkgJSON;
}
