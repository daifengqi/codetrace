import { readFileSync } from "fs";
import { existFile } from "../utils";

export function readWorkSpace() {
  if (!existFile("pnpm-workspace.yaml") && !existFile("pnpm-workspace.yml")) {
    return;
  }

  let content: string | undefined;

  if (existFile("pnpm-workspace.yaml")) {
    content = readFileSync("pnpm-workspace.yaml", "utf-8");
  } else {
    content = readFileSync("pnpm-workspace.yml", "utf-8");
  }

  return content;
}
