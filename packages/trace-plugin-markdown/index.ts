import * as fs from "fs";

export function markdown(options?: { name?: string }) {
  if (!options) {
    options = { name: "README" };
  }
  const { name } = options;

  return {
    targetDirHandler(files: string[]) {
      const mdPaths = files.map((path) => `${path}/${name}.md`);

      const mdPathContent = mdPaths
        .filter((path) => fs.existsSync(path) && fs.statSync(path).isFile())
        .map((path) => {
          const content = fs.readFileSync(path, "utf-8");
          return {
            path,
            content,
          };
        });

      console.log(mdPathContent);
    },
  };
}
