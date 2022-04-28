import cac from "cac";
import { statcode } from "./constants";
import { run } from "./core/deps";

export async function main() {
  const cli = cac(statcode);

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
