import fs from "fs";
import { traceConfigJs } from "../constants";

const defaultConfig = {
  entry: "src/App.tsx",
  packageJsonPath: ["package.json"],
  outputDir: ["pages", "modules"],
  extensions: [".js", ".ts", ".jsx", ".tsx"],
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
