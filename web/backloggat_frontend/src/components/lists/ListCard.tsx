import type { ListInfo } from "../../interfaces/lists.interfaces";
import { formatRange, todayISO } from "../../utils/datesUtils";
import { ProgressBar } from "./ProgressBar";

type Props = {
    list: ListInfo;
    index?: number;
    onClick?: (l: ListInfo) => void;
    onEdit?: (l: ListInfo) => void;
    onDelete?: (l: ListInfo) => void;
};

export function ListCard({ list, index = 0, onClick, onEdit, onDelete }: Props) {
    const today = todayISO();
    const isCurrent = list.start_date <= today && today <= list.end_date;

    const action = (fn?: (l: ListInfo) => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        fn?.(list);
    };

    return (
        <article
            onClick={() => onClick?.(list)}
            style={{ "--i": index } as React.CSSProperties}
            className="glass corners rise group relative cursor-pointer overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">
                        {list.title}
                    </h3>
                    <p className="text-xs text-[#A7B5AD]">{formatRange(list.start_date, list.end_date)}</p>
                </div>

                {isCurrent && (
                    <span className="shrink-0 rounded-full border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-2.5 py-0.5 text-xs text-[#8FD3AE]">
                        Current
                    </span>
                )}
            </div>

            {list.description && (
                <p className="mt-3 line-clamp-2 text-sm text-[#A7B5AD]">{list.description}</p>
            )}

            <div className="my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

            <ProgressBar done={list.done_count} total={list.tasks_count} />

            <div className="mt-4 flex items-center justify-between text-xs text-[#A7B5AD]">
                <span className="num">{list.days_count} days</span>

                <div className="flex gap-1 transition focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={action(onEdit)}
                            className="rounded-md px-2 py-1 transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={action(onDelete)}
                            className="rounded-md px-2 py-1 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}