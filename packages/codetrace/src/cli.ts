#!/usr/bin/env node

import { index } from "./index";
import { error_log } from "./utils/cli";

index().catch((e) => {
  error_log("[main]", e);
});
