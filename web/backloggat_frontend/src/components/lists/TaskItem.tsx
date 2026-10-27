import type { TaskInfo, TaskPriority } from "../../interfaces/lists.interfaces";
import { DeleteIcon } from "../../utils/iconsUtils";

type Props = {
    task: TaskInfo;
    onToggle: (t: TaskInfo) => void;
    onEdit?: (t: TaskInfo) => void;
    onDelete?: (t: TaskInfo) => void;
    showProjectBadge?: boolean;
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
    HIGH: "#f87171",
    MEDIUM: "#fbbf24",
    LOW: "#64748b",
};

export function TaskItem({ task, onToggle, onEdit, onDelete, showProjectBadge = true }: Props) {
    const done = task.status === "DONE";

    return (
        <li
            onClick={() => onEdit?.(task)}
            className={`glass group flex items-center gap-3 rounded-xl py-3 pl-3 pr-2 ${onEdit ? "cursor-pointer" : ""
                }`}
            style={{ borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}` }}
        >
            <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={done ? "Mark as pending" : "Mark as done"}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(task);
                }}
                className={`grid size-5 shrink-0 place-items-center rounded-full border text-[11px] transition ${done
                        ? "border-[#8FD3AE] bg-[#8FD3AE] text-black"
                        : "border-white/30 hover:border-[#8FD3AE]"
                    }`}
            >
                {done && "✓"}
            </button>

            <span
                className={`min-w-0 flex-1 truncate text-sm ${done ? "text-[#A7B5AD] line-through" : "text-[#F2F2F2]"
                    }`}
            >
                {task.title}
            </span>

            {task.status === "DOING" && (
                <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                    Doing
                </span>
            )}
            {showProjectBadge && task.project_id && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#A7B5AD]">
                    Project
                </span>
            )}
            {task.day_id && !showProjectBadge && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#A7B5AD]">
                    Daily
                </span>
            )}

            {onDelete && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task);
                    }}
                    className="shrink-0 flex items-center rounded-md px-2 py-1 text-xs text-[#A7B5AD] transition hover:bg-red-500/10 cursor-pointer hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0"
                >
                    <DeleteIcon />
                    <span className="ml-2">Delete</span>
                </button>
            )}
        </li>
    );
}