import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "../../context/ApiContext";
import { useDebounce } from "../../hooks/useDebounce";
import UITextField from "../UITextField";
import { NoteFormModal, type NotePayload } from "../notes/NoteFormModal";
import { ProjectNoteCard } from "./ProjectNoteCard";
import type { NoteDetail } from "../../interfaces/notes.interfaces";
import type { ResourceInfo } from "../../interfaces/resources.interfaces";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import type { NoteRef } from "../../interfaces/projects.interfaces";

type Props = {
    projectId: string;
    reloadKey: number;
    onChanged: () => void;
    skills: SkillInfo[];
    resources: ResourceInfo[];
};

export function NotesTab({ projectId, reloadKey, onChanged, skills, resources }: Props) {
    const { requestAuth } = useApi();

    const [items, setItems] = useState<NoteRef[]>([]);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<NoteDetail | null>(null);

    const debouncedSearch = useDebounce(search.trim(), 300);
    const requestId = useRef(0);

    const fetchItems = useCallback(async () => {
        const id = ++requestId.current;

        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);

        const data = await requestAuth<NoteRef[]>(`/api/projects/${projectId}/notes?${params}`, {
            method: "GET",
        });
        if (id !== requestId.current) return;
        if (data) setItems(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, debouncedSearch]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems, reloadKey]);

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
    };

    const openEdit = async (n: NoteRef) => {
        const detail = await requestAuth<NoteDetail>(`/api/notes/${n.id}`, { method: "GET" });
        if (!detail) return;
        setEditing(detail);
        setFormOpen(true);
    };

    const handleSave = async (payload: NotePayload): Promise<boolean> => {
        const url = editing ? `/api/notes/${editing.id}` : "/api/notes";
        const data = await requestAuth(url, {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(payload),
        });
        if (!data) return false;

        closeForm();
        onChanged();
        return true;
    };

    const handlePin = async (n: NoteRef) => {
        await requestAuth(`/api/notes/${n.id}/pin`, {
            method: "PATCH",
            body: JSON.stringify({ pinned: !n.pinned }),
        });
        onChanged();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <UITextField
                        label="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search notes..."
                    />
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                    }}
                    className="h-11 cursor-pointer mb-7 shrink-0 rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
                >
                    New note
                </button>
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-[#A7B5AD]">
                    {debouncedSearch ? "No notes match your search" : "No notes in this project yet"}
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((n) => (
                        <ProjectNoteCard key={n.id} note={n} onClick={openEdit} onPin={handlePin} />
                    ))}
                </div>
            )}

            <NoteFormModal
                open={formOpen}
                note={editing}
                skills={skills}
                resources={resources}
                extra={{ projectId: Number(projectId) }}
                onClose={closeForm}
                onSubmit={handleSave}
            />
        </div>
    );
}