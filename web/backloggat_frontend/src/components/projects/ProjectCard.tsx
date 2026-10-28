import type { ProjectInfo } from "../../interfaces/projects.interfaces";
import { formatRange, formatShort } from "../../utils/datesUtils";
import { DeleteIcon } from "../../utils/iconsUtils";
import { ProgressBar } from "../lists/ProgressBar";

type Props = {
    project: ProjectInfo;
    index?: number;
    onClick?: (p: ProjectInfo) => void;
    onDelete?: (p: ProjectInfo) => void;
};

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

export function ProjectCard({ project: p, index = 0, onClick, onDelete }: Props) {

    const done = p.status === "DONE";

    return (
        <article
            onClick={() => onClick?.(p)}
            style={{ "--i": index } as React.CSSProperties}
            className="glass corners rise group relative cursor-pointer overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">{p.title}</h3>
                    <p className="text-xs text-[#A7B5AD]">
                        {p.end_date ? formatRange(p.start_date, p.end_date) : `Since ${formatShort(p.start_date)}`}
                    </p>
                </div>

                <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${done
                            ? "border-[#8FD3AE]/40 bg-[#8FD3AE]/10 text-[#8FD3AE]"
                            : "border-white/10 bg-white/5 text-[#A7B5AD]"
                        }`}
                >
                    {done ? "Done" : "Active"}
                </span>
            </div>

            <div className="my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

            <ProgressBar done={p.done_count} total={p.tasks_count} />

            <div className="mt-4 flex flex-wrap gap-1.5">
                <Counter label="notes" value={p.notes_count} />
                <Counter label="resources" value={p.resources_count} />
                <Counter label="skills" value={p.skills_count} />
            </div>

            {onDelete && (
                <div className="mt-4 flex justify-end text-xs">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(p);
                        }}
                        className="rounded-md px-2 py-1 flex items-center text-[#A7B5AD] transition hover:bg-red-500/10 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0 cursor-pointer"
                    >
                        <DeleteIcon />
                        <span className="ml-2">Delete</span>
                    </button>
                </div>
            )}
        </article>
    );
}