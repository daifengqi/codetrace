export function markdown(options?: { name?: string }) {
  const { name } = options;

  return (files) => {
    console.log("--- markdown");
    console.log(files, name);
  };
}
