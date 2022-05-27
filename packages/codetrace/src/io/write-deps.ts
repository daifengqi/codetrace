import * as fs from "fs";
import { cdepsJson, depsJson } from "../constants";
import { DepMap } from "../types/file";
import { removeLastFile } from "../utils";

function writeFile(file: string, content: string) {
  const dir = removeLastFile(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(file, content);
}

function map2JSON(m: Map<any, any>) {
  return JSON.stringify(Object.fromEntries(m));
}

export function writeDeps(props: { deps: DepMap; cdeps: DepMap }) {
  const { deps, cdeps } = props;

  writeFile(depsJson, map2JSON(deps));
  writeFile(cdepsJson, map2JSON(cdeps));
}
