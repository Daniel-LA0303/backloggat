import { useEffect, useState } from "react";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { UISelect } from "../UISelect";
import type { TaskPriority } from "../../interfaces/lists.interfaces";

export type ProjectTaskPayload = {
    title: string;
    priority: TaskPriority;
    addToDaily: boolean;
    startDate?: string;
    endDate?: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: ProjectTaskPayload) => Promise<boolean>;
};

export function ProjectTaskModal({ open, onClose, onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [addToDaily, setAddToDaily] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle("");
        setPriority("LOW");
        setStartDate("");
        setEndDate("");
        setAddToDaily(false);
        setError("");
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const t = title.trim();
        if (!t) return setError("Title is required");
        if (t.length > 200) return setError("Title must be 200 characters or less");
        if (startDate && endDate && endDate < startDate) return setError("End date must be after start date");
        setError("");

        setSaving(true);
        await onSubmit({
            title: t,
            priority,
            addToDaily,
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
        });
        setSaving(false);
    };

    return (
        <Modal open={open} onClose={onClose} className="w-full md:max-w-md" title="New task">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <UITextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?" />

                <div>
                    <p className="mb-1 text-sm text-[#A7B5AD]">Priority</p>
                    <UISelect value={priority} onChange={(v) => setPriority(v as TaskPriority)}>
                        <UISelect.Option value="LOW">Low</UISelect.Option>
                        <UISelect.Option value="MEDIUM">Medium</UISelect.Option>
                        <UISelect.Option value="HIGH">High</UISelect.Option>
                    </UISelect>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <UITextField label="Start (default: today)" type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)} />
                    <UITextField label="End (default: start)" type="date" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#A7B5AD]">
                    <input
                        type="checkbox"
                        checked={addToDaily}
                        onChange={(e) => setAddToDaily(e.target.checked)}
                        className="size-4 accent-[#8FD3AE]"
                    />
                    Also add to today's daily tasks
                </label>

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
                        {saving ? "Saving..." : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}