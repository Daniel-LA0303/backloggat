import { useEffect, useState } from "react";
import { useApi } from "../../context/ApiContext";
import { TaskItem } from "../lists/TaskItem";
import { ProjectNoteCard } from "./ProjectNoteCard";
import { ResourceMini } from "./ResourceMini";
import type { TaskInfo } from "../../interfaces/lists.interfaces";
import type { ProjectSummary } from "../../interfaces/projects.interfaces";
import { timeAgo } from "../../utils/datesUtils";

type Props = {
    projectId: string;
    reloadKey: number;
    onChanged: () => void;
    onGoTab: (tab: "tasks" | "notes" | "resources") => void;
};

function Section({
    title,
    action,
    children,
}: {
    title: string;
    action?: { label: string; onClick: () => void };
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-wider text-[#A7B5AD]">{title}</h3>
                {action && (
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="text-xs text-[#8FD3AE] transition hover:underline"
                    >
                        {action.label}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

export function SummaryTab({ projectId, reloadKey, onChanged, onGoTab }: Props) {
    const { requestAuth } = useApi();
    const [data, setData] = useState<ProjectSummary | null>(null);

    useEffect(() => {
        const load = async () => {
            const res = await requestAuth<ProjectSummary>(`/api/projects/${projectId}/summary`, { method: "GET" });
            if (res) setData(res);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, reloadKey]);

    // optimistic check: change the UI first, confirm with the backend after
    const handleToggle = async (t: TaskInfo) => {
        const status = t.status === "DONE" ? "TO_DO" : "DONE";

        setData((d) =>
            d ? { ...d, recentTasks: d.recentTasks.map((x) => (x.id === t.id ? { ...x, status } : x)) } : d,
        );

        await requestAuth(`/api/projects/${projectId}/tasks/${t.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        onChanged(); // refreshes header progress and this tab (also reverts if it failed)
    };

    if (!data) return null;

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-8">
                <Section title="Pinned notes" action={{ label: "All notes", onClick: () => onGoTab("notes") }}>
                    {data.pinnedNotes.length === 0 ? (
                        <p className="text-sm text-[#A7B5AD]/70">No pinned notes</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {data.pinnedNotes.map((n) => (
                                <ProjectNoteCard key={n.id} note={n} onClick={() => onGoTab("notes")} />
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Recent tasks" action={{ label: "All tasks", onClick: () => onGoTab("tasks") }}>
                    {data.recentTasks.length === 0 ? (
                        <p className="text-sm text-[#A7B5AD]/70">No tasks yet</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {data.recentTasks.map((t) => (
                                <TaskItem key={t.id} task={t} onToggle={handleToggle} showProjectBadge={false} />
                            ))}
                        </ul>
                    )}
                </Section>
            </div>

            <div className="flex flex-col gap-8">
                <Section title="Resources" action={{ label: "All resources", onClick: () => onGoTab("resources") }}>
                    {data.resources.length === 0 ? (
                        <p className="text-sm text-[#A7B5AD]/70">No resources linked</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {data.resources.map((r) => (
                                <ResourceMini key={r.id} resource={r} />
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title="Recent activity">
                    {data.activity.length === 0 ? (
                        <p className="text-sm text-[#A7B5AD]/70">No activity yet</p>
                    ) : (
                        <ul className="glass flex flex-col divide-y divide-white/5 rounded-xl">
                            {data.activity.map((a) => (
                                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                    <span className="min-w-0 truncate text-sm text-[#F2F2F2]">{a.action}</span>
                                    <span className="shrink-0 text-xs text-[#A7B5AD]">{timeAgo(a.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </div>
        </div>
    );
}