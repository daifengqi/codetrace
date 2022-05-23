import cac from "cac";
import ora from "ora";
import { writeDefaultConfig } from "./options/init";
import { trace } from "./constants";
import { main } from "./core/main";
import { getGitDiff } from "./options/git";
import { Params } from "./types";
import { readConfig } from "./io/read-config";

const spinner = ora("Analyzing the dependency graph... \n");

function run(params: Params) {
  spinner.start();

  const config = readConfig();
  // handlers is the executed result of plugins
  const { plugins: handlers } = config;

  return Promise.resolve(main({ config, params, handlers })).finally(() => {
    spinner.stop();
  });
}

export async function index() {
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
        run({ diff_files: diffFiles });
        return;
      }

      // default run with config
      run({});
    });

  cli.help();

  cli.parse();
}
