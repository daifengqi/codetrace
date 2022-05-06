import { execSync } from "child_process";

export function getGitDiff() {
  const str = execSync("git status -sb", { encoding: "utf-8" });
  const regex = /[a-zA-Z]\S*[a-zA-Z]/g;

  return [...str.matchAll(regex)].map((v) => v[0]);
}
