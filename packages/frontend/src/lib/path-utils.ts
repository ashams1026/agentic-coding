/** Compute a relative path from `from` to `to` (browser-safe, POSIX only). */
export function relative(from: string, to: string): string {
  // Normalize: strip trailing slashes
  const f = from.replace(/\/+$/, "");
  const t = to.replace(/\/+$/, "");

  if (t.startsWith(f + "/")) {
    return t.slice(f.length + 1);
  }
  // Fallback: return the absolute path
  return t;
}
