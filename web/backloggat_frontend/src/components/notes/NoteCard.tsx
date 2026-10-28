import type { NoteInfo } from "../../interfaces/notes.interfaces";
import { DeleteIcon, EditIcon } from "../../utils/iconsUtils";

type Props = {
  note: NoteInfo;
  index?: number;
  onClick?: (n: NoteInfo) => void;
  onPin?: (n: NoteInfo) => void;
  onEdit?: (n: NoteInfo) => void;
  onDelete?: (n: NoteInfo) => void;
};

function formatDate(value: string) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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

export function NoteCard({ note, index = 0, onClick, onPin, onEdit, onDelete }: Props) {
  const action = (fn?: (n: NoteInfo) => void) => (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger the card's onClick
    fn?.(note);
  };

  return (
    <article
      onClick={() => onClick?.(note)}
      style={{ "--i": index } as React.CSSProperties}
      className="glass corners rise group relative cursor-pointer overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 size-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: note.color }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: note.color, boxShadow: `0 0 14px ${note.color}99` }}
          />
          <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">
            {note.title}
          </h3>
        </div>

        {note.pinned && (
          <span className="shrink-0 rounded-full border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-2.5 py-0.5 text-xs text-[#8FD3AE]">
            Pinned
          </span>
        )}
      </div>

      <div className="relative my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

      {/* description is plain text, safe to render as is */}
      <p className="relative line-clamp-3 min-h-[3.75rem] text-sm text-[#A7B5AD]">
        {note.description || <span className="opacity-50">No description</span>}
      </p>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        <Counter label="skills" value={note.skills_count} />
        <Counter label="resources" value={note.resources_count} />
        <Counter label="projects" value={note.projects_count} />
      </div>

      <div className="relative mt-4 flex items-center justify-between text-xs text-[#A7B5AD]">
        <span>Updated {formatDate(note.updated_at)}</span>

        <div className="flex gap-1 transition focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
          {onPin && (
            <button
              type="button"
              onClick={action(onPin)}
              className="rounded-md cursor-pointer px-2 py-1 transition hover:bg-white/5 hover:text-[#F2F2F2]"
            >
              <span>{note.pinned ? "Unpin" : "Pin"}</span>
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={action(onEdit)}
              className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]"
            >
              <EditIcon size={13} />
              <span className="ml-2">Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={action(onDelete)}
              className="rounded-md cursor-pointer flex items-center px-2 py-1 transition hover:bg-red-500/10 hover:text-red-300"
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