import fs from "fs";
import { traceConfigJs } from "../constants";
import { Config } from "../types";

const defaultConfig: Config = {
  entry: "src/main.js",
  sourceDir: ["pages", "modules"],
  aliasReplace: {
    "@/": "apps/src/",
  },
};

export function writeDefaultConfig() {
  fs.writeFileSync(
    traceConfigJs,
    `module.exports = ${JSON.stringify(defaultConfig)}`
  );
}
