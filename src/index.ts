import cac from "cac";
import { writeDefaultConfig } from "./config/write";
import { trace } from "./constants";
import { run } from "./core/deps";
import { getGitDiff } from "./core/git";

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
        run({ diffFiles });
        return;
      }
      run();
    });

  cli.help();

  cli.parse();
}
