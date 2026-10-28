import type { KnowledgeInfo } from "../../interfaces/knowledge.interfaces";
import { DeleteIcon, EditIcon } from "../../utils/iconsUtils";

type KnowledgeCardProps = {
  knowledge: KnowledgeInfo;
  index?: number;
  onClick?: (k: KnowledgeInfo) => void;
  onEdit?: (k: KnowledgeInfo) => void;
  onDelete?: (k: KnowledgeInfo) => void;
};

function formatDate(value: string) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// description may be HTML from the rich text editor: show it as plain text
function toPlainText(html: string) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export function KnowledgeCard({ knowledge, index = 0, onClick, onEdit, onDelete }: KnowledgeCardProps) {
  const preview = toPlainText(knowledge.description);

  return (
    <article
      onClick={() => onClick?.(knowledge)}
      style={{ "--i": index } as React.CSSProperties}
      className="glass corners rise group relative cursor-pointer overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 size-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: knowledge.color }}
      />

      <div className="relative flex items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: knowledge.color, boxShadow: `0 0 14px ${knowledge.color}99` }}
        />
        <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">
          {knowledge.name}
        </h3>
      </div>

      <div className="relative my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

      <p className="relative line-clamp-3 min-h-[3.75rem] text-sm text-[#A7B5AD]">
        {preview || <span className="opacity-50">No description</span>}
      </p>

      <div className="relative mt-4 flex items-center justify-between text-xs text-[#A7B5AD]">
        <span>Created {formatDate(knowledge.created_at)}</span>

        <div className="flex gap-1 sm:opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(knowledge);
              }}
              className="cursor-pointer flex items-center rounded-md px-2 py-1 transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]"
            >
              <EditIcon size={13}/>
              <span className="ml-2">Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(knowledge);
              }}
              className="cursor-pointer flex items-center rounded-md px-2 py-1 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <DeleteIcon size={13} />
              <span className="ml-2">Delete</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}