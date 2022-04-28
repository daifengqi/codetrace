#!/usr/bin/env node

import { main } from "./index";

main().catch((e) => {
  console.log("[main]", e);
});
