import * as fs from "fs";
import path from "path";

export function isAlias(
  filePath: string,
  aliasReplace: Record<string, string>
) {
  for (const key of Object.keys(aliasReplace)) {
    if (filePath.startsWith(key)) {
      return true;
    }
  }
  return false;
}

export function replaceAlias(
  filePath: string,
  aliasReplace: Record<string, string>
) {
  Object.keys(aliasReplace).forEach((key) => {
    if (filePath.startsWith(key)) {
      filePath = filePath.replace(key, aliasReplace[key]);
    }
  });
  return filePath;
}

export function removeLastFile(filePath: string) {
  return filePath.substring(0, filePath.lastIndexOf("/"));
}

export function existValidFile(props: {
  filePath: string;
  extensions: string[];
}) {
  const { filePath, extensions } = props;
  return (
    fs.existsSync(filePath) &&
    fs.statSync(filePath).isFile() &&
    extensions.some((ext) => filePath.endsWith(ext))
  );
}

export function existFile(path: string) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}

export function existFolder(path: string) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

export function parseParams(params: string[]) {
  return {
    src: params?.find((p) => p.startsWith("src="))?.substring(4),
    tar: params?.find((p) => p.startsWith("tar="))?.substring(4),
  };
}
