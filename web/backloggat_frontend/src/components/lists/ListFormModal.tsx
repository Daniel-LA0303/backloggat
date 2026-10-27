import { useEffect, useState } from "react";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { UISelect } from "../UISelect";
import type { ListInfo } from "../../interfaces/lists.interfaces";
import { monthRange, MONTHS } from "../../utils/datesUtils";

export type ListPayload = {
    title: string;
    description: string;
    startDate?: string; // create only
    endDate?: string;   // create only
};

type Props = {
    open: boolean;
    list?: ListInfo | null; // present = edit
    onClose: () => void;
    onSubmit: (payload: ListPayload) => Promise<boolean>;
};

export function ListFormModal({ open, list, onClose, onSubmit }: Props) {
    const isEdit = !!list;
    const now = new Date();
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [title, setTitle] = useState("");
    const [titleTouched, setTitleTouched] = useState(false);
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        const n = new Date();
        setMonth(n.getMonth());
        setYear(n.getFullYear());
        setTitle(list?.title ?? `${MONTHS[n.getMonth()]} ${n.getFullYear()}`);
        setTitleTouched(!!list);
        setDescription(list?.description ?? "");
        setError("");
    }, [open, list]);

    // keep the title in sync with month/year until the user types their own
    const pick = (m: number, y: number) => {
        setMonth(m);
        setYear(y);
        if (!titleTouched) setTitle(`${MONTHS[m]} ${y}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return setError("Title is required");
        if (t.length > 100) return setError("Title must be 100 characters or less");
        setError("");

        const payload: ListPayload = isEdit
            ? { title: t, description: description.trim() }
            : { title: t, description: description.trim(), ...monthRange(year, month) };

        setSaving(true);
        await onSubmit(payload);
        setSaving(false);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="w-full md:max-w-md"
            title={isEdit ? "Edit list" : "New list"}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">
                {!isEdit && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="mb-1 text-sm text-[#A7B5AD]">Month</p>
                            <UISelect value={String(month)} onChange={(v) => pick(Number(v), year)}>
                                {MONTHS.map((m, i) => (
                                    <UISelect.Option key={m} value={String(i)}>{m}</UISelect.Option>
                                ))}
                            </UISelect>
                        </div>
                        <div>
                            <p className="mb-1 text-sm text-[#A7B5AD]">Year</p>
                            <UISelect value={String(year)} onChange={(v) => pick(month, Number(v))}>
                                {years.map((y) => (
                                    <UISelect.Option key={y} value={String(y)}>{y}</UISelect.Option>
                                ))}
                            </UISelect>
                        </div>
                    </div>
                )}

                <div>
                    <UITextField
                        label="Title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setTitleTouched(true);
                        }}
                    />
                    {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
                </div>

                <UITextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    multiline={true}
                    rows={3}
                />

                {isEdit && (
                    <p className="text-xs text-[#A7B5AD]">
                        Dates can't change because the days were already created.
                    </p>
                )}

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
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}