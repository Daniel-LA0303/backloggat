import DOMPurify from "dompurify";
import type { ProjectDetail } from "../../interfaces/projects.interfaces";
import { ProgressBar } from "../lists/ProgressBar";
import { formatRange, formatShort } from "../../utils/datesUtils";

type Props = {
    project: ProjectDetail;
    onBack: () => void;
    onNewTask: () => void;
    onEdit: () => void;
};

export function ProjectHeader({ project: p, onBack, onNewTask, onEdit }: Props) {
    const done = p.status === "DONE";

    return (
        <header className="glass flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-1 text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2]"
                    >
                        ← All projects
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl">{p.title}</h1>
                        <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs ${done
                                    ? "border-[#8FD3AE]/40 bg-[#8FD3AE]/10 text-[#8FD3AE]"
                                    : "border-white/10 bg-white/5 text-[#A7B5AD]"
                                }`}
                        >
                            {done ? "Done" : "Active"}
                        </span>
                    </div>
                    <p className="text-sm text-[#A7B5AD]">
                        {p.end_date ? formatRange(p.start_date, p.end_date) : `Since ${formatShort(p.start_date)}`}
                    </p>
                </div>

                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={onNewTask}
                        className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
                    >
                        + New task
                    </button>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#F2F2F2] transition hover:border-[#8FD3AE]/40"
                    >
                        Edit project
                    </button>
                </div>
            </div>

            {p.description && (
                <div className="rich-text rich-view text-sm">
                    <div className="tiptap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description) }} />
                </div>
            )}

            <ProgressBar done={p.done_count} total={p.tasks_count} />

            {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {p.skills.map((s) => (
                        <span
                            key={s.id}
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#F2F2F2]"
                        >
                            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                        </span>
                    ))}
                </div>
            )}
        </header>
    );
}