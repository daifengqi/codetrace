import cac from "cac";
import ora from "ora";
import { writeDefaultConfig } from "./config/write";
import { trace } from "./constants";
import { run } from "./core/main";
import { getGitDiff } from "./core/git";

const spinner = ora("Analyzing the dependency graph... \n");

export async function main() {
  const cli = cac(trace);

  cli
    .command("[...params]", "")
    .option("-i, --init", "Create a config file in root dir.")
    .option("-g, --git", "Use git diff files to track influenced result.")
    .action((params, options) => {
      if (options.init) {
        writeDefaultConfig();
        return;
      }
      if (options.git) {
        const diffFiles = getGitDiff();
        spinner.start();
        run({ diffFiles });
        spinner.stop();
        return;
      }

      // default run with config
      spinner.start();
      run();
      spinner.stop();
    });

  cli.help();

  cli.parse();
}
