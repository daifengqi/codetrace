import fs from "fs";
import { traceConfigJs } from "../constants";

const defaultConfig = {
  entry: "src/main.js",
  outputDir: ["pages", "modules"],
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
