import cac from "cac";
import fs from "fs";
import { writeDefaultConfig } from "./config/write";
import { statcode, statcodeConfigJs } from "./constants";
import { run } from "./core/deps";

export async function main() {
  const cli = cac(statcode);

  cli
    .command("[...params]", "Create new project from cli.")
    .action((params, options) => {
      run();
    });

  cli.help();

  cli.parse();
}
