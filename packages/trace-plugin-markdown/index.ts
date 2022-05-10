import * as fs from "fs";

export function markdown(options?: { name?: string }) {
  if (!options) {
    options = { name: "README" };
  }
  const { name } = options;

  return (files: string[]) => {
    const mdPaths = files.map((path) => `${path}/${name}.md`);

    const mdContent = mdPaths
      .filter((path) => fs.existsSync(path) && fs.statSync(path).isFile())
      .map((path) => {
        const content = fs.readFileSync(path, "utf-8");
        return content;
      });

    console.log("--- mdContent");
    console.log(mdContent);
    console.log("--- ");
  };
}
