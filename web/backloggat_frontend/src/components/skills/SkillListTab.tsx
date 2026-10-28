import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useApi } from "../../context/ApiContext";
import { useDebounce } from "../../hooks/useDebounce";
import { ListFilters, type ListFiltersValue } from "../UIListFilters";

type Props<T extends { id: number }, K extends string> = {
  path: string;            // e.g. "/api/notes"
  skillId: string;
  reloadKey: number;
  sortOptions: { value: K; label: string }[];
  defaultFilters: ListFiltersValue<K>;
  searchPlaceholder: string;
  emptyText: string;
  emptyFilteredText: string;
  action: { label: string; onClick: () => void };
  layout?: "grid" | "list";
  renderItem: (item: T, index: number) => ReactNode;
};

export function SkillListTab<T extends { id: number }, K extends string>({
  path,
  skillId,
  reloadKey,
  sortOptions,
  defaultFilters,
  searchPlaceholder,
  emptyText,
  emptyFilteredText,
  action,
  layout = "grid",
  renderItem,
}: Props<T, K>) {
  const { requestAuth } = useApi();

  const [items, setItems] = useState<T[]>([]);
  const [filters, setFilters] = useState(defaultFilters);

  const debouncedSearch = useDebounce(filters.search.trim(), 300);
  const requestId = useRef(0);

  const fetchItems = useCallback(async () => {
    const id = ++requestId.current;

    // every param is set BEFORE the request
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("skill_id", skillId);
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<T[]>(`${path}?${params}`, { method: "GET" });
    if (id !== requestId.current) return; // ignore out-of-order responses
    if (data) setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, skillId, debouncedSearch, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, reloadKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-lg border cursor-pointer border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
        >
          {action.label}
        </button>
      </div>

      <ListFilters
        value={filters}
        onChange={setFilters}
        sortOptions={sortOptions}
        searchPlaceholder={searchPlaceholder}
      />

      {items.length === 0 ? (
        <p className="py-6 text-center text-[#A7B5AD]">
          {debouncedSearch ? emptyFilteredText : emptyText}
        </p>
      ) : (
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 gap-3 md:grid-cols-2"
              : "flex flex-col gap-2"
          }
        >
          {items.map((item, i) => (
            <div key={item.id} className="contents">
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}