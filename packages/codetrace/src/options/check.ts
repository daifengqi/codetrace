import { readFileSync } from "fs";
import { cdepsJson, depsJson } from "../constants";
import { hitTarget } from "../core/helper";
import { DepMap, DirPath, FilePath } from "../types/file";
import { existFile, existFolder } from "../utils";
import { error_log, message_log } from "../utils/cli";

function parseMap(text: string) {
  return new Map(Object.entries(JSON.parse(text))) as DepMap;
}

function dfs(props: {
  current: string;
  record: string[];
  records: string[][];
  graph: DepMap;
  endDirs: string[];
}) {
  const { current, record, records, graph, endDirs } = props;

  if (hitTarget({ filePath: current, endDirs })) {
    records.push([...record, current]);
    return;
  }

  const nextList = graph.get(current);
  if (!nextList) {
    return;
  }

  for (const next of nextList) {
    dfs({
      current: next,
      record: [...record, current],
      records,
      graph,
      endDirs,
    });
  }
}

export function checkTraceResult(options: {
  src?: FilePath;
  tar?: DirPath;
  endDirs: string[];
}) {
  const { src, tar, endDirs } = options;

  if (!existFile(depsJson) || !existFile(cdepsJson)) {
    error_log("You should have run `npx trace` or `npx trace -g` before.");
    return;
  }

  if (!src && !tar) {
    error_log("Must input at least one params (`src=...` or `tar=...`).");
    return;
  }

  const deps = parseMap(readFileSync(depsJson, "utf-8"));
  const cdeps = parseMap(readFileSync(cdepsJson, "utf-8"));

  if (src && !tar) {
    if (!cdeps.has(src)) {
      error_log(
        `No ${src} file in dependency graph; please run \`npx trace\`.`
      );
      return;
    }

    const records = [];
    dfs({
      current: src,
      record: [],
      records,
      graph: cdeps,
      endDirs,
    });

    return records;
  }

  if (!src && tar) {
    if (!Object.keys(deps).includes(tar)) {
      error_log(
        `No ${tar} file in dependency graph; please run \`npx trace\`.`
      );
      return;
    }
    // TODO: trace from folders to files
  }

  if (src && tar) {
    if (!Object.keys(deps).includes(src)) {
      error_log(
        `No ${src} file in dependency graph; please run \`npx trace\`.`
      );
      return;
    }
    if (!Object.keys(cdeps).includes(src)) {
      error_log(
        `No ${tar} file in inverted dependency graph; please run \`npx trace\`.`
      );
      return;
    }
    // TODO: finger out the path
  }
}
