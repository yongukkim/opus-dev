export type ConsoleListSortOrder = "asc" | "desc";

export type ConsoleListQueryParams = {
  page?: number;
  q?: string;
  sort?: string;
  order?: ConsoleListSortOrder;
};

export function parseConsoleListSortOrder(raw: string | undefined): ConsoleListSortOrder | undefined {
  if (raw === "asc" || raw === "desc") return raw;
  return undefined;
}

export function buildConsoleListQuery(params: ConsoleListQueryParams): string {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.sort?.trim()) sp.set("sort", params.sort.trim());
  if (params.order) sp.set("order", params.order);
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** Toggle asc → desc → asc on the same column; changing column starts at asc (page 1). */
export function nextConsoleListSort(
  column: string,
  currentSort: string | undefined,
  currentOrder: ConsoleListSortOrder | undefined,
): { sort: string; order: ConsoleListSortOrder } {
  if (currentSort !== column) {
    return { sort: column, order: "asc" };
  }
  return { sort: column, order: currentOrder === "asc" ? "desc" : "asc" };
}

export function sortIndicator(
  column: string,
  currentSort: string | undefined,
  currentOrder: ConsoleListSortOrder | undefined,
): string {
  if (currentSort !== column || !currentOrder) return "";
  return currentOrder === "asc" ? " ↑" : " ↓";
}
