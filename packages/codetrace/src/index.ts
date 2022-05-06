import cac from "cac";
import ora from "ora";
import { writeDefaultConfig } from "./io/write";
import { trace } from "./constants";
import { runMain } from "./core/main";
import { getGitDiff } from "./core/git";

const spinner = ora("Analyzing the dependency graph... \n");

function run(...args) {
  spinner.start();

  return Promise.resolve(runMain(...args)).finally(() => {
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
        await run({ diffFiles });
        return;
      }

      // default run with config
      await run();
    });

  cli.help();

  cli.parse();
}
