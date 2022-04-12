import path from "path";
import { statcodeConfigJs } from "../constants";

let config;

try {
  config = require(path.resolve(process.cwd(), statcodeConfigJs));
} catch (e) {
  throw Error(`require statcode.config.js error -> ${e.message}`);
}

export { config };
