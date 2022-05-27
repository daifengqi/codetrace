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

export function message_log(...text: any) {
  log(`${logSymbols.info} ${chalk.cyan(...text)}\n`);
}

export function arrow_join_log(record: string[]) {
  message_log(record.join(" -> "));
}
