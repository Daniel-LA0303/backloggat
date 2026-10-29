import type { PasswordInfo } from "../../interfaces/passwords.interfaces";
import { DeleteIcon, EyeIcon } from "../../utils/iconsUtils";

type Props = {
  item: PasswordInfo;
  index?: number;
  onShow?: (p: PasswordInfo) => void;
  onDelete?: (p: PasswordInfo) => void;
};

function formatDate(value: string) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function PasswordCard({ item, index = 0, onShow, onDelete }: Props) {
  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className="glass corners rise group relative overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 size-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: item.color }}
      />

      <div className="relative flex items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: item.color, boxShadow: `0 0 14px ${item.color}99` }}
        />
        <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">{item.name}</h3>
      </div>

      <div className="relative my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

      <div className="relative space-y-1 text-sm">
        <p className="truncate text-[#F2F2F2]">
          {item.site_username || <span className="text-[#A7B5AD]/50">No username</span>}
        </p>
        <p className="num text-[#A7B5AD]">••••••••••••</p>
        {item.url && <p className="truncate text-xs text-[#A7B5AD]">{item.url}</p>}
      </div>

      <div className="relative mt-4 flex items-center justify-between text-xs text-[#A7B5AD]">
        <span>Created {formatDate(item.created_at)}</span>

        <div className="flex gap-1 sm:opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onShow?.(item)}
            className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]"
          >
            <EyeIcon size={13}/>
            <span className="ml-2">Show</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(item)}
            className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <DeleteIcon size={13}/>
            <span className="ml-2">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}