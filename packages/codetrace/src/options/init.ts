import * as fs from "fs";
import { traceConfigJs } from "../constants";
import { Config } from "../types";

const comment = `

// entry: string;
// The entry point of the App.

// endDirs: string[];
// Final influenced files should be under which directory, these are converged point.

// packageJsonPath?: string[];
// Add sub-app's pakcage.json path if you have. It by default has "pacakge.json" in root dir.
// We use this to exclude packages that are dependencies in packaga.json when build the dependency graph.

// include?: string[];
// Specify some packages included in the dependency graph. These packages will not be removed when building the graph.

// extensions?: string[];
// Traced file name extension, with ["js","ts","tsx","jsx"] by default. You will overwrite the default if you have this config.

// alias?: Record<string, string>;
// Replace alias when import library.

// files?: string[]; 
// We recommend to use -g/--git to get changed files. However, you can manually add some files.

// verbose?: boolean;
// Print logs when trace dependency graph if set to true.

// plugins?: (options: any) => { targetDirHandler: (dirs: string[]) => void }
// A Plugin should return a function-in-object with files/dirs in final dirs; specify what you will do
// after get these files.

`;

const defaultConfig: Config = {
  entry: "src/main.js",
  endDirs: ["pages", "modules"],
  alias: {
    "@/": "src/",
  },
  plugins: [],
};

export function writeDefaultConfig() {
  fs.writeFileSync(
    traceConfigJs,
    `${comment}\nmodule.exports = ${JSON.stringify(defaultConfig)}`
  );
}
