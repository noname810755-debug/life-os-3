let counter = 0;
export function uid(prefix = "id"): string {
  counter = (counter + 1) % 100000;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.floor(
    Math.random() * 1e6,
  ).toString(36)}`;
}
