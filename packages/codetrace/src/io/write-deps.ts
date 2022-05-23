import * as fs from "fs";
import { DepType } from "../types/dep";

const position = "node_modules/.codetrace";

export function writeDeps(props: { deps: DepType; cdeps: DepType }) {
  const { deps, cdeps } = props;

  fs.writeFileSync(`${position}/deps.json`, JSON.stringify(deps));
  fs.writeFileSync(`${position}/cdeps.json`, JSON.stringify(cdeps));
}
