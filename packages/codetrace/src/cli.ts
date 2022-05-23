#!/usr/bin/env node

import { main } from "./index";
import { error_log } from "./utils/clit";

main().catch((e) => {
  error_log("[main]", e);
});
