import UITextField from './UITextField';

export type SortOrder = "asc" | "desc";

export type ListFiltersValue<K extends string = string> = {
  search: string;
  sortBy: K;
  order: SortOrder;
};

type SortOption<K extends string> = { value: K; label: string };

type ListFiltersProps<K extends string> = {
  value: ListFiltersValue<K>;
  onChange: (value: ListFiltersValue<K>) => void;
  sortOptions: SortOption<K>[];
  searchPlaceholder?: string;
  className?: string;
};


export function ListFilters<K extends string>({
  value,
  onChange,
  sortOptions,
  searchPlaceholder = "Search...",
  className = "",
}: ListFiltersProps<K>) {
  const patch = (p: Partial<ListFiltersValue<K>>) => onChange({ ...value, ...p });

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end ${className}`}>
      <div className="flex-1">
        <UITextField
          label="Search"
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="flex gap-2">
        <select
          value={value.sortBy}
          onChange={(e) => patch({ sortBy: e.target.value as K })}
          aria-label="Sort by"
          className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-[#F2F2F2] outline-none transition focus:border-[#8FD3AE]/50 [&>option]:bg-neutral-900"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => patch({ order: value.order === "asc" ? "desc" : "asc" })}
          aria-label={value.order === "asc" ? "Ascending" : "Descending"}
          title={value.order === "asc" ? "Ascending" : "Descending"}
          className="h-11 w-11 rounded-lg border border-white/10 bg-black/20 text-[#F2F2F2] transition hover:border-[#8FD3AE]/50 hover:text-[#8FD3AE]"
        >
          {value.order === "asc" ? "↑" : "↓"}
        </button>
      </div>
    </div>
  );
}