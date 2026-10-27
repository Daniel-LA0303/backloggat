import { useState } from "react";
import { UISelect } from "../UISelect";
import type { TaskPriority } from "../../interfaces/lists.interfaces";

type Props = {
    onAdd: (title: string, priority: TaskPriority) => Promise<boolean>;
};

export function QuickAddTask({ onAdd }: Props) {
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        if (!t || busy) return;

        setBusy(true);
        const ok = await onAdd(t, priority);
        setBusy(false);
        if (ok) setTitle(""); // keep the text if it failed
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Add a task and press Enter"
                className="h-11 flex-1 rounded-xl border border-[#96bea8]/25 bg-[#121c17]/55 px-4 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/35 focus:border-[#96bea8]/60"
            />
            <UISelect
                className="w-full sm:w-36 cursor-pointer"
                size="large"
                value={priority}
                onChange={(v) => setPriority(v as TaskPriority)}
            >
                <UISelect.Option value="LOW">Low</UISelect.Option>
                <UISelect.Option value="MEDIUM">Medium</UISelect.Option>
                <UISelect.Option value="HIGH">High</UISelect.Option>
            </UISelect>
        </form>
    );
}