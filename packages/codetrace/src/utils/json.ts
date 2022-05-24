import { PkgJSON } from "../types/dep";

export function parsePkgJson(text: string) {
  return JSON.parse(text) as PkgJSON;
}
