import path from "path";
import { statcodeConfigJs } from "../constants";

const config = require(path.resolve(process.cwd(), statcodeConfigJs));

export { config };
