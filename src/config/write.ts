import fs from "fs";
import { statcodeConfigJs } from "../constants";

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
    statcodeConfigJs,
    `module.exports = ${JSON.stringify(defaultConfig)}`
  );
}
