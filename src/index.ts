import cac from "cac";
import { writeDefaultConfig } from "./config/write";
import { trace } from "./constants";
import { run } from "./core/deps";

export async function main() {
  const cli = cac(trace);

  cli
    .command("[...params]", "Create new project from cli.")
    .option("--init, -i", "Init a config file in root dir.")
    .action((params, options) => {
      if (options.init) {
        writeDefaultConfig();
        return;
      }
      run();
    });

  cli.help();

  cli.parse();
}
