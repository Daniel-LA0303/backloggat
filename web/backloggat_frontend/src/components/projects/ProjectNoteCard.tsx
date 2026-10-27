import type { NoteRef } from "../../interfaces/projects.interfaces";
import { timeAgo } from "../../utils/datesUtils";


type Props = {
    note: NoteRef;
    onClick?: (n: NoteRef) => void;
    onPin?: (n: NoteRef) => void;
};

export function ProjectNoteCard({ note, onClick, onPin }: Props) {
    return (
        <article
            onClick={() => onClick?.(note)}
            className={`glass group flex flex-col gap-2 rounded-xl p-4 ${onClick ? "cursor-pointer" : ""}`}
        >
            <div className="flex items-center gap-2">
                <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: note.color, boxShadow: `0 0 10px ${note.color}99` }}
                />
                <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#F2F2F2]">{note.title}</h4>
                {note.pinned && (
                    <span className="shrink-0 rounded-full border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-2 py-0.5 text-[10px] text-[#8FD3AE]">
                        Pinned
                    </span>
                )}
            </div>

            <p className="line-clamp-2 text-xs text-[#A7B5AD]">
                {note.description || <span className="opacity-50">No description</span>}
            </p>

            <div className="flex items-center justify-between text-[11px] text-[#A7B5AD]">
                <span>Updated {timeAgo(note.updated_at)}</span>
                {onPin && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPin(note);
                        }}
                        className="rounded-md px-2 py-0.5 transition hover:bg-white/5 hover:text-[#F2F2F2] focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0"
                    >
                        {note.pinned ? "Unpin" : "Pin"}
                    </button>
                )}
            </div>
        </article>
    );
}