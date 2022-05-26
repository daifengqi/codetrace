export function isNpm(props: { library: string; npmPackages: string[] }) {
  const { library, npmPackages } = props;
  return npmPackages.includes(library);
}

export function getReposNpm(repoPath: string, name: string) {
  return `${repoPath}:${name}`;
}

export function isReposNpm(name: string) {
  return name.includes(":");
}
