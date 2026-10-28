import { ArrowDownIcon, ArrowUpIcon } from '../utils/iconsUtils';
import { UISelect } from './UISelect';
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
    <div className={`flex justify-center flex-col gap-3 md:flex-row items-center ${className}`}>
      <div className="flex-1">
        <UITextField
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="flex items-center gap-2 ">

        <div className='w-32'>
          <UISelect
            value={value.sortBy}
            onChange={(v) => patch({ sortBy: v as K })}
          >
            {sortOptions.map((m) => (
              <UISelect.Option key={m.value} value={m.value}>
                {m.label}
              </UISelect.Option>
            ))}
          </UISelect>
        </div>

        <button
          type="button"
          onClick={() => patch({ order: value.order === "asc" ? "desc" : "asc" })}
          aria-label={value.order === "asc" ? "Ascending" : "Descending"}
          title={value.order === "asc" ? "Ascending" : "Descending"}
          className="h-11 w-11 px-3 rounded-lg border border-white/10 bg-black/20 text-[#F2F2F2] transition hover:border-[#8FD3AE]/50 hover:text-[#8FD3AE] cursor-pointer"
        >
          <span className='flex justify-center items-center'>{value.order === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}</span>
        </button>
      </div>
    </div>
  );
}