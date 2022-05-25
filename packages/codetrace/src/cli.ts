#!/usr/bin/env node

import ora from "ora";
import { index } from "./index";
import { error_log } from "./utils/cli";

const spinner = ora("Analyzing the dependency graph... \n");

index(() => {
  spinner.start();
})
  .catch((e) => {
    error_log("[main]", e);
    console.error(e);
  })
  .finally(() => {
    spinner.stop();
  });
