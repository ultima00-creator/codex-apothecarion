const marks = [
  "var(--color-ink)",
  "var(--color-bronze)",
  "var(--color-wine)",
  "var(--color-olive)",
  "var(--color-slate)",
] as const;

export function mark(key: string): string {
  let n = 0;
  for (let i = 0; i < key.length; i += 1) n = (n + key.charCodeAt(i) * (i + 1)) % marks.length;
  return marks[n];
}
