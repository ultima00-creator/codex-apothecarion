const marks = [
  "#3dff9a",
  "#ff5c33",
  "#ffd23a",
  "#4ecbff",
  "#ff4fd8",
  "#c6ff3a",
  "#ff8a1e",
  "#8d7bff",
] as const;

export function mark(key: string): string {
  let n = 0;
  for (let i = 0; i < key.length; i += 1) n = (n + key.charCodeAt(i) * (i + 1)) % marks.length;
  return marks[n];
}
