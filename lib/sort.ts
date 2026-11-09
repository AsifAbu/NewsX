export type SortDir = "asc" | "desc";

export function parseSort(value: string | undefined, fallback: SortDir): SortDir {
  return value === "asc" || value === "desc" ? value : fallback;
}

export function toggle(dir: SortDir): SortDir {
  return dir === "asc" ? "desc" : "asc";
}
