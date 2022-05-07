export function markdown(options?: { name?: string }) {
  const { name } = options;

  return (files) => {
    console.log(files, name);
  };
}
