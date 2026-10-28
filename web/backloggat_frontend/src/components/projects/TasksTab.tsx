import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "../../context/ApiContext";
import { useDebounce } from "../../hooks/useDebounce";
import { ListFilters, type ListFiltersValue } from "../UIListFilters";
import { UISelect } from "../UISelect";
import Modal from "../Modal";
import { TaskItem } from "../lists/TaskItem";
import { TaskEditModal, type TaskPayload } from "../lists/TaskEditModal";
import type { TaskInfo } from "../../interfaces/lists.interfaces";

type Props = {
    projectId: string;
    reloadKey: number;
    onChanged: () => void;
};

type SortKey = "status" | "priority" | "title" | "end_date" | "created_at";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
    { value: "title", label: "Title" },
    { value: "end_date", label: "Due date" },
    { value: "created_at", label: "Created" },
];

const DEFAULT_FILTERS: ListFiltersValue<SortKey> = { search: "", sortBy: "status", order: "asc" };

const STATUS_CHIPS = [
    { value: "", label: "All" },
    { value: "TO_DO", label: "To do" },
    { value: "DOING", label: "Doing" },
    { value: "DONE", label: "Done" },
];

export function TasksTab({ projectId, reloadKey, onChanged }: Props) {
    const { requestAuth } = useApi();

    const [items, setItems] = useState<TaskInfo[]>([]);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [editing, setEditing] = useState<TaskInfo | null>(null);
    const [toDelete, setToDelete] = useState<TaskInfo | null>(null);

    const debouncedSearch = useDebounce(filters.search.trim(), 300);
    const requestId = useRef(0);

    const fetchItems = useCallback(async () => {
        const id = ++requestId.current;

        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status) params.set("status", status);
        if (priority) params.set("priority", priority);
        params.set("sort_by", filters.sortBy);
        params.set("order", filters.order);

        const data = await requestAuth<TaskInfo[]>(`/api/projects/${projectId}/tasks?${params}`, {
            method: "GET",
        });
        if (id !== requestId.current) return;
        if (data) setItems(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, debouncedSearch, status, priority, filters.sortBy, filters.order]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems, reloadKey]);

    const handleToggle = async (t: TaskInfo) => {
        const next = t.status === "DONE" ? "TO_DO" : "DONE";
        setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));

        await requestAuth(`/api/projects/${projectId}/tasks/${t.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: next }),
        });
        onChanged();
    };

    const handleEditSave = async (id: number, payload: TaskPayload): Promise<boolean> => {
        const data = await requestAuth<TaskInfo>(`/api/projects/${projectId}/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        if (!data) return false;
        setEditing(null);
        onChanged();
        return true;
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        await requestAuth(`/api/projects/${projectId}/tasks/${toDelete.id}`, { method: "DELETE" });
        setToDelete(null);
        onChanged();
    };

    const hasFilters = debouncedSearch !== "" || status !== "" || priority !== "";

    const chip = (active: boolean) =>
        `rounded-full border px-3 py-1 text-xs cursor-pointer transition ${active
            ? "border-[#8FD3AE]/50 bg-[#8FD3AE]/10 text-[#8FD3AE]"
            : "border-white/10 bg-white/5 text-[#A7B5AD] hover:border-white/20"
        }`;

    return (
        <div className="flex flex-col gap-4">
            <ListFilters
                value={filters}
                onChange={setFilters}
                sortOptions={SORT_OPTIONS}
                searchPlaceholder="Search tasks..."
            />

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2">
                    {STATUS_CHIPS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setStatus(c.value)}
                            aria-pressed={status === c.value}
                            className={chip(status === c.value)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <UISelect className="w-full sm:w-44" value={priority} onChange={setPriority}>
                    <UISelect.Option value="">All priorities</UISelect.Option>
                    <UISelect.Option value="HIGH">High</UISelect.Option>
                    <UISelect.Option value="MEDIUM">Medium</UISelect.Option>
                    <UISelect.Option value="LOW">Low</UISelect.Option>
                </UISelect>
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-[#A7B5AD]">
                    {hasFilters ? "No tasks match your filters" : "No tasks yet, create one"}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {items.map((t) => (
                        <TaskItem
                            key={t.id}
                            task={t}
                            onToggle={handleToggle}
                            onEdit={setEditing}
                            onDelete={setToDelete}
                            showProjectBadge={false}
                        />
                    ))}
                </ul>
            )}

            <TaskEditModal task={editing} onClose={() => setEditing(null)} onSubmit={handleEditSave} />

            <Modal
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                className="w-full md:max-w-sm"
                title="Delete task"
            >
                <p className="text-sm text-[#A7B5AD]">
                    {toDelete?.day_id ? (
                        <>
                            <span className="text-[#F2F2F2]">{toDelete.title}</span> is also in a daily list, so it
                            will only be removed from this project.
                        </>
                    ) : (
                        <>
                            Delete <span className="text-[#F2F2F2]">{toDelete?.title}</span>? This cannot be undone.
                        </>
                    )}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setToDelete(null)}
                        className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmDelete}
                        className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                    >
                        {toDelete?.day_id ? "Remove" : "Delete"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}