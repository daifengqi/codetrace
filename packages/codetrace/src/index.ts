import cac from "cac";
import ora from "ora";
import { writeDefaultConfig } from "./options/init";
import { trace } from "./constants";
import { main } from "./core/main";
import { getGitDiff } from "./options/git";
import { Params } from "./types";
import { readConfig } from "./io/read-config";
import { message_log } from "./utils/cli";
import { parseParams } from "./utils";
import { checkTraceResult } from "./options/check";

export function run(params: Params) {
  const config = readConfig();
  // handlers is the executed result of plugins
  const { plugins: handlers } = config;

  return Promise.resolve(main({ config, params, handlers }));
}

export async function index(beforeStart?: () => void) {
  beforeStart?.();

  const cli = cac(trace);

  cli
    .command("[...params]", "")
    .option("-i, --init", "Create a config file in root dir.")
    .option("-g, --git", "Use git diff files to track influenced result.")
    .option(
      "-c, --check",
      "[src?=file_name tar?=dir_name] Check the trace result of source or targe"
    )
    .action(
      (
        params: string[],
        options: { init?: boolean; git?: boolean; check?: boolean }
      ) => {
        if (options.init) {
          writeDefaultConfig();
          return;
        }
        if (options.git) {
          const diffFiles = getGitDiff();
          run({ diff_files: diffFiles });
          return;
        }
        if (options.check) {
          const { src, tar } = parseParams(params);
          const config = readConfig();
          checkTraceResult({
            src,
            tar,
            endDirs: config.endDirs,
          });
          return;
        }

        // default run with config
        run({});
      }
    );

  cli.help();

  cli.parse();
}
