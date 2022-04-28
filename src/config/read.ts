import path from "path";
import { traceConfigJs } from "../constants";

let config;

try {
  config = require(path.resolve(process.cwd(), traceConfigJs));
} catch (e) {
  throw Error(`require statcode.config.js error -> ${e.message}`);
}

export { config };
