import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { RichTextEditor } from "../RichTextEditor";
import { EditIcon } from "../../utils/iconsUtils";


type Props = {
    value: string; // HTML
    onSave: (html: string) => Promise<boolean>;
};

export function DayNote({ value, onSave }: Props) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    // if the saved value changes (refetch), keep the draft in sync while not editing
    useEffect(() => {
        if (!editing) setDraft(value);
    }, [value, editing]);

    const startEdit = () => {
        setDraft(value);
        setEditing(true);
    };

    const cancel = () => {
        setDraft(value);
        setEditing(false);
    };

    const save = async () => {
        setSaving(true);
        const ok = await onSave(draft);
        setSaving(false);
        if (ok) setEditing(false); // back to the normal view
    };

    return (
        <section className="glass flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-[#A7B5AD]">Day note</p>
                {!editing && (
                    <button
                        type="button"
                        onClick={startEdit}
                        className="rounded-md px-2 py-1 text-xs text-[#A7B5AD] transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE] flex items-center cursor-pointer"
                    >
                        <EditIcon size={15}/>
                        <span className="ml-2">{value ? "Edit" : "Add note"}</span>
                    </button>
                )}
            </div>

            {editing ? (
                <>
                    <RichTextEditor
                        value={draft}
                        onChange={setDraft}
                        placeholder="Anything to remember about this day"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={saving}
                            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </>
            ) : value ? (
                <div className="rich-text rich-view">
                    <div
                        className="tiptap"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
                    />
                </div>
            ) : (
                <p className="text-sm text-[#A7B5AD]/60">No note for this day</p>
            )}
        </section>
    );
}