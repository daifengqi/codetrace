import { readFileSync } from "fs";
import { cdepsJson, depsJson } from "../constants";
import { filterFilesByDirLevel, hitTarget } from "../core/helper";
import { DepMap, DirPath, FilePath } from "../types/file";
import { existFile, existFolder } from "../utils";
import {
  arrow_join_log,
  error_log,
  message_log,
  success_log,
} from "../utils/cli";

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

    const records: string[][] = [];
    dfs({
      current: src,
      record: [],
      records,
      graph: cdeps,
      endDirs,
    });

    records.forEach((record) => {
      arrow_join_log(record);
    });
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
    if (!cdeps.has(src)) {
      error_log(
        `No ${src} file in dependency graph; please run \`npx trace\`.`
      );
      return;
    }
    const records: string[][] = [];
    dfs({
      current: src,
      record: [],
      records,
      graph: cdeps,
      endDirs,
    });

    const targetFiles = records.map((p) => p[p.length - 1]);
    const targetDirsSet = filterFilesByDirLevel({
      endDirs,
      targetFiles,
    });

    if (!targetDirsSet.has(tar)) {
      error_log(`Cannot trace from ${src} to ${tar}.`);
      return;
    }

    const targetRecords = records.filter((p) => {
      const filePath = p[p.length - 1];
      if (filePath.startsWith(tar)) {
        return true;
      }
      return false;
    });

    targetRecords.forEach((record) => {
      arrow_join_log(record);
    });
  }
}
