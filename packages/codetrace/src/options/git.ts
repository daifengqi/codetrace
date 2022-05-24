import { execSync } from "child_process";
import { diffFileRegex } from "../constants/regex";

export function getGitDiff() {
  const str = execSync("git status -sb", { encoding: "utf-8" });

  return [...str.matchAll(diffFileRegex)].map((v) => v[0]);
}
