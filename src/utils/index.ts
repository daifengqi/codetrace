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

export function isSelfModules(name: string, includePkgs: string[]) {
  for (const mod of includePkgs) {
    if (name.startsWith(mod)) {
      return true;
    }
  }
  return false;
}

export function removeLastFile(filePath: string) {
  return filePath.substring(0, filePath.lastIndexOf("/"));
}
