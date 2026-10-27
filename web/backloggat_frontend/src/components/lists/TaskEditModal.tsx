import { useEffect, useState } from "react";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { UISelect } from "../UISelect";
import type { TaskInfo, TaskPriority, TaskStatus } from "../../interfaces/lists.interfaces";

export type TaskPayload = {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    startDate: string;
    endDate: string;
};

type Props = {
    task: TaskInfo | null; // open when not null
    onClose: () => void;
    onSubmit: (id: number, payload: TaskPayload) => Promise<boolean>;
};

export function TaskEditModal({ task, onClose, onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState<TaskStatus>("TO_DO");
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!task) return;
        setTitle(task.title);
        setStatus(task.status);
        setPriority(task.priority);
        setStartDate(task.start_date);
        setEndDate(task.end_date);
        setError("");
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        const t = title.trim();
        if (!t) return setError("Title is required");
        if (t.length > 200) return setError("Title must be 200 characters or less");
        if (!startDate || !endDate) return setError("Both dates are required");
        if (endDate < startDate) return setError("End date must be after start date");
        setError("");

        setSaving(true);
        await onSubmit(task.id, { title: t, status, priority, startDate, endDate });
        setSaving(false);
    };

    return (
        <Modal open={!!task} onClose={onClose} className="w-full md:max-w-md" title="Edit task">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">
                <UITextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="mb-1 text-sm text-[#A7B5AD]">Status</p>
                        <UISelect value={status} onChange={(v) => setStatus(v as TaskStatus)}>
                            <UISelect.Option value="TO_DO">To do</UISelect.Option>
                            <UISelect.Option value="DOING">Doing</UISelect.Option>
                            <UISelect.Option value="DONE">Done</UISelect.Option>
                        </UISelect>
                    </div>
                    <div>
                        <p className="mb-1 text-sm text-[#A7B5AD]">Priority</p>
                        <UISelect value={priority} onChange={(v) => setPriority(v as TaskPriority)}>
                            <UISelect.Option value="LOW">Low</UISelect.Option>
                            <UISelect.Option value="MEDIUM">Medium</UISelect.Option>
                            <UISelect.Option value="HIGH">High</UISelect.Option>
                        </UISelect>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <UITextField label="Start" type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)} />
                    <UITextField label="End" type="date" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} />
                </div>

                {error && <p className="text-xs text-red-300">{error}</p>}

                <div className="mt-2 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}