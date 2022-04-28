import cac from "cac";
import { trace } from "./constants";
import { run } from "./core/deps";

export async function main() {
  const cli = cac(trace);

  cli
    .command("[...params]", "Create new project from cli.")
    .option("--print, -p", "Print the logs while collecting the dependents.")
    .action((params, options) => {
      console.log("options:", options);
      run();
    });

  cli.help();

  cli.parse();
}
