import cac from "cac";
import ora from "ora";
import { writeDefaultConfig } from "./io/write";
import { trace } from "./constants";
import { collectFile } from "./core/main";
import { getGitDiff } from "./core/git";
import { Params, Plugins } from "./types";
import { pluginHandler } from "./plugin";
import { readConfig } from "./io/read";

const spinner = ora("Analyzing the dependency graph... \n");

function run(params: Params) {
  spinner.start();

  const config = readConfig();
  const { plugins } = config;

  return Promise.resolve(collectFile({ config, params }))
    .then((cFiles) => {
      pluginHandler(cFiles, plugins);
    })
    .finally(() => {
      spinner.stop();
    });
}

export async function main() {
  const cli = cac(trace);

  cli
    .command("[...params]", "")
    .option("-i, --init", "Create a config file in root dir.")
    .option("-g, --git", "Use git diff files to track influenced result.")
    .action(async (params, options) => {
      if (options.init) {
        writeDefaultConfig();
        return;
      }
      if (options.git) {
        const diffFiles = getGitDiff();
        run({ diff_files: diffFiles });
        return;
      }

      // default run with config
      run({});
    });

  cli.help();

  cli.parse();
}
