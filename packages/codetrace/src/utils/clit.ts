import chalk from "chalk";
import logSymbols from "log-symbols";

const { log } = console;

export function success_log(...text: any) {
  log(`${logSymbols.success} ${chalk.green(...text)}\n`);
}

export function error_log(...text: any) {
  log(`${logSymbols.error} ${chalk.red(...text)}\n`);
}

export function warn_log(...text: any) {
  log(`${logSymbols.warning} ${chalk.yellow(...text)}\n`);
}
