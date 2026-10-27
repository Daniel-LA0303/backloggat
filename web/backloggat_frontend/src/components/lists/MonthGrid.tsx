import type { DayInfo } from "../../interfaces/lists.interfaces";
import { parseISO, todayISO, weekOffset } from "../../utils/datesUtils";


const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
    days: DayInfo[]; // already sorted by date
    onSelect: (d: DayInfo) => void;
};

function stateOf(d: DayInfo) {
    const pending = d.tasks_count - d.done_count;
    return {
        pending,
        allDone: d.tasks_count > 0 && pending === 0,
        isToday: d.task_date === todayISO(),
    };
}

function DayCell({ day, onSelect }: { day: DayInfo; onSelect: (d: DayInfo) => void }) {
    const { pending, allDone, isToday } = stateOf(day);

    return (
        <button
            type="button"
            onClick={() => onSelect(day)}
            className={`glass flex aspect-square min-h-16 cursor-pointer flex-col justify-between rounded-xl p-2 text-left transition hover:-translate-y-0.5 hover:border-[#8FD3AE]/40 ${isToday ? "ring-2 ring-[#8FD3AE]/70" : ""
                } ${allDone ? "bg-[#8FD3AE]/10" : ""}`}
        >
            <span className={`num text-sm font-semibold ${isToday ? "text-[#8FD3AE]" : "text-[#F2F2F2]"}`}>
                {parseISO(day.task_date).getDate()}
            </span>

            {day.tasks_count > 0 && (
                <span
                    className={`num self-end rounded-full px-1.5 py-0.5 text-[10px] ${allDone ? "bg-[#8FD3AE]/20 text-[#8FD3AE]" : "bg-white/10 text-[#F2F2F2]"
                        }`}
                >
                    {allDone ? "✓" : pending}
                </span>
            )}
        </button>
    );
}

export function MonthGrid({ days, onSelect }: Props) {
    if (days.length === 0) return null;
    const offset = weekOffset(days[0].task_date);

    return (
        <>
            {/* desktop: calendar */}
            <div className="hidden grid-cols-7 gap-2 md:grid">
                {WEEKDAYS.map((w) => (
                    <p key={w} className="pb-1 text-center text-xs uppercase tracking-wider text-[#A7B5AD]">
                        {w}
                    </p>
                ))}
                {Array.from({ length: offset }, (_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {days.map((d) => (
                    <DayCell key={d.id} day={d} onSelect={onSelect} />
                ))}
            </div>

            {/* mobile: vertical list */}
            <div className="flex flex-col gap-2 md:hidden">
                {days.map((d) => {
                    const { pending, allDone, isToday } = stateOf(d);
                    const date = parseISO(d.task_date);
                    return (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onSelect(d)}
                            className={`glass cursor-pointer flex items-center justify-between rounded-xl px-4 py-3 text-left ${isToday ? "ring-2 ring-[#8FD3AE]/70" : ""
                                }`}
                        >
                            <span className="text-sm text-[#F2F2F2]">
                                {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                            <span className={`num text-xs ${allDone ? "text-[#8FD3AE]" : "text-[#A7B5AD]"}`}>
                                {d.tasks_count === 0 ? "—" : allDone ? "All done" : `${pending} pending`}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}