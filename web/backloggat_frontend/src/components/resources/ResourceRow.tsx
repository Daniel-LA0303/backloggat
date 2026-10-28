import { useState } from "react";
import { typeLabel, type ResourceInfo } from "../../interfaces/resources.interfaces";
import { CopyIcon, DeleteIcon, EditIcon } from "../../utils/iconsUtils";


type Props = {
  item: ResourceInfo;
  index?: number;
  onEdit?: (r: ResourceInfo) => void;
  onDelete?: (r: ResourceInfo) => void;
};

function domainOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <span
      title={`${value} ${label}`}
      className={`num rounded-md border px-2 py-0.5 text-[11px] ${value > 0
          ? "border-white/10 bg-white/5 text-[#F2F2F2]"
          : "border-white/5 bg-transparent text-[#A7B5AD]/50"
        }`}
    >
      {value} {label}
    </span>
  );
}

export function ResourceRow({ item, index = 0, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  const open = () => window.open(item.link, "_blank", "noopener,noreferrer");

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const action = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation(); // don't open the link
    fn();
  };

  return (
    <article
      onClick={open}
      style={{ "--i": index } as React.CSSProperties}
      className="glass rise group flex cursor-pointer flex-col gap-3 p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center"
    >
      <span className="w-fit shrink-0 rounded-md border border-[#8FD3AE]/30 bg-[#8FD3AE]/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-[#8FD3AE] sm:w-20 sm:text-center">
        {typeLabel(item.type)}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold tracking-tight text-[#F2F2F2]">{item.name}</h3>
        <p className="truncate text-xs text-[#A7B5AD]">{domainOf(item.link)}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Counter label="skills" value={item.skills_count} />
        <Counter label="notes" value={item.notes_count} />
        <Counter label="projects" value={item.projects_count} />
      </div>

      <div className="flex shrink-0 gap-1 text-xs text-[#A7B5AD] transition focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
        <button
          type="button"
          onClick={copy}
          className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-white/5 hover:text-[#F2F2F2]"
        >
          <CopyIcon size={13} />
          <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={action(() => onEdit(item))}
            className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]"
          >
            <EditIcon size={13} />
            <span className="ml-2">Edit</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={action(() => onDelete(item))}
            className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <DeleteIcon size={13} />
            <span className="ml-2">Delete</span>
          </button>
        )}
      </div>
    </article>
  );
}