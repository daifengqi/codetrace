import fs from "fs";
import { traceConfigJs } from "../constants";
import { Config } from "../types";

const comment = `

// entry: string; /* The entry point of the App, only one entry supported for now */

// targetDir: string[]; /* Output final influenced files under which directory */

// packageJsonPath?: string[]; /* Add sub-app's pakcage.json path if you have */

// includeDep?: string[]; /* Local package name specified */

// extensions?: string[]; /* Traced file extension, with js/ts/tsx/jsx by default; node that you config will overwrite default */

// aliasReplace?: Record<string, string>; /* Replace alias if you have when import library */

// diffFiles?: string[]; /* If you don't use -g/--git, you can manually include files to trace */

// showLogs?: boolean; /* Print logs when trace dependency graph if set to true */

`;

const defaultConfig: Config = {
  entry: "src/main.js",
  targetDir: ["pages", "modules"],
  aliasReplace: {
    "@/": "apps/src/",
  },
};

export function writeDefaultConfig() {
  fs.writeFileSync(
    traceConfigJs,
    `${comment}module.exports = ${JSON.stringify(defaultConfig)}`
  );
}
