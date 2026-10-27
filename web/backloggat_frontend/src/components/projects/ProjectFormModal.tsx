import { useEffect, useState } from "react";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { UISelect } from "../UISelect";
import {
    RESOURCE_TYPES,
    typeLabel,
    type ResourceInfo,
    type ResourceType,
} from "../../interfaces/resources.interfaces";
import type { NoteInfo } from "../../interfaces/notes.interfaces";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import type {
    NoteRef,
    ProjectDetail,
    ProjectStatus,
    ResourceRef,
} from "../../interfaces/projects.interfaces";
import { RichTextEditor } from "../RichTextEditor";

export type ProjectPayload = {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    skillsIds: number[];
    status?: ProjectStatus;           // edit
    notesIds?: number[];              // create
    resourcesIds?: number[];          // create
    addResourcesIds?: number[];       // edit
    removeResourcesIds?: number[];    // edit
    removeNotesIds?: number[];        // edit (deletes the notes)
};

type Props = {
    open: boolean;
    project?: ProjectDetail | null; // present = edit
    projectNotes?: NoteRef[];       // edit: notes currently in the project
    projectResources?: ResourceRef[]; // edit: resources currently linked
    skills: SkillInfo[];
    notes: NoteInfo[];              // create: existing notes to link
    resources: ResourceInfo[];
    onCreateSkill: (name: string) => Promise<SkillInfo | null>;
    onCreateResource: (p: { name: string; link: string; type: ResourceType }) => Promise<ResourceInfo | null>;
    onClose: () => void;
    onSubmit: (payload: ProjectPayload) => Promise<boolean>;
};

const LINK_RE = /^https?:\/\/\S+$/;

const inputClass =
    "h-10 w-full rounded-xl border border-[#96bea8]/25 bg-[#121c17]/55 px-3 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/35 focus:border-[#96bea8]/60";

function PickedChip({
    label,
    dot,
    danger,
    onRemove,
}: {
    label: string;
    dot?: string;
    danger?: boolean;
    onRemove: () => void;
}) {
    return (
        <span
            className={`flex items-center gap-2 rounded-full border py-1 pl-3 pr-1.5 text-xs ${danger
                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                    : "border-[#8FD3AE]/40 bg-[#8FD3AE]/10 text-[#8FD3AE]"
                }`}
        >
            {dot && <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />}
            {label}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="grid size-5 place-items-center rounded-full transition hover:bg-red-500/10 hover:text-red-300"
            >
                ×
            </button>
        </span>
    );
}

// quick creator: type a name, press Enter
function NewSkillInput({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const create = async () => {
        const n = name.trim();
        if (!n || busy) return;
        setBusy(true);
        await onCreate(n);
        setBusy(false);
        setName("");
    };

    return (
        <div className="mt-2 flex gap-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        create();
                    }
                }}
                maxLength={50}
                placeholder="Or create a new skill and press Enter"
                className={inputClass}
            />
            <button
                type="button"
                onClick={create}
                disabled={busy || !name.trim()}
                className="shrink-0 rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-3 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50"
            >
                {busy ? "..." : "Create"}
            </button>
        </div>
    );
}

function NewResourceForm({
    onCreate,
}: {
    onCreate: (p: { name: string; link: string; type: ResourceType }) => Promise<boolean>;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [type, setType] = useState<ResourceType>("article");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const create = async () => {
        const n = name.trim();
        const l = link.trim();
        if (!n) return setError("Name is required");
        if (!LINK_RE.test(l)) return setError("Link must start with http:// or https://");
        setError("");

        setBusy(true);
        const ok = await onCreate({ name: n, link: l, type });
        setBusy(false);
        if (ok) {
            setName("");
            setLink("");
            setOpen(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 text-xs text-[#8FD3AE] transition hover:underline"
            >
                + New resource
            </button>
        );
    }

    return (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <UISelect value={type} onChange={(v) => setType(v as ResourceType)}>
                {RESOURCE_TYPES.map((t) => (
                    <UISelect.Option key={t.value} value={t.value}>{t.label}</UISelect.Option>
                ))}
            </UISelect>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-[#A7B5AD] transition hover:bg-white/5"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={create}
                    disabled={busy}
                    className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-3 py-1.5 text-xs text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50"
                >
                    {busy ? "Creating..." : "Create and add"}
                </button>
            </div>
        </div>
    );
}

export function ProjectFormModal({
    open,
    project,
    projectNotes = [],
    projectResources = [],
    skills,
    notes,
    resources,
    onCreateSkill,
    onCreateResource,
    onClose,
    onSubmit,
}: Props) {
    const isEdit = !!project;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
    const [skillIds, setSkillIds] = useState<number[]>([]);
    const [resourceIds, setResourceIds] = useState<number[]>([]);
    const [noteIds, setNoteIds] = useState<number[]>([]); // create: chosen. edit: kept
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle(project?.title ?? "");
        setDescription(project?.description ?? "");
        setStartDate(project?.start_date ?? new Date().toLocaleDateString("sv-SE")); // YYYY-MM-DD local
        setEndDate(project?.end_date ?? "");
        setStatus(project?.status ?? "ACTIVE");
        setSkillIds(project?.skills.map((s) => s.id) ?? []);
        setResourceIds(projectResources.map((r) => r.id));
        setNoteIds(projectNotes.map((n) => n.id));
        setError("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, project]);

    const originalResourceIds = projectResources.map((r) => r.id);

    const addTo = (set: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
        set((p) => (p.includes(id) ? p : [...p, id]));
    const removeFrom = (set: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
        set((p) => p.filter((x) => x !== id));

    const availableSkills = skills.filter((s) => !skillIds.includes(s.id));
    const pickedSkills = skills.filter((s) => skillIds.includes(s.id));
    const availableResources = resources.filter((r) => !resourceIds.includes(r.id));
    const pickedResources = resources.filter((r) => resourceIds.includes(r.id));

    // create: pick from all notes. edit: only the notes already in the project
    const noteSource: { id: number; title: string }[] = isEdit ? projectNotes : notes;
    const availableNotes = isEdit ? [] : noteSource.filter((n) => !noteIds.includes(n.id));
    const pickedNotes = noteSource.filter((n) => noteIds.includes(n.id));
    const notesToDelete = isEdit ? projectNotes.filter((n) => !noteIds.includes(n.id)) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const t = title.trim();
        if (!t) return setError("Title is required");
        if (t.length > 150) return setError("Title must be 150 characters or less");
        if (!startDate) return setError("Start date is required");
        if (endDate && endDate < startDate) return setError("End date must be after start date");
        setError("");

        const base = { title: t, description, startDate, endDate, skillsIds: skillIds };

        const payload: ProjectPayload = project
            ? {
                ...base,
                status,
                addResourcesIds: resourceIds.filter((id) => !originalResourceIds.includes(id)),
                removeResourcesIds: originalResourceIds.filter((id) => !resourceIds.includes(id)),
                removeNotesIds: notesToDelete.map((n) => n.id),
            }
            : { ...base, notesIds: noteIds, resourcesIds: resourceIds };

        setSaving(true);
        await onSubmit(payload);
        setSaving(false);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="w-full md:max-w-3xl"
            title={isEdit ? "Edit project" : "New project"}
        >
            <form
                onSubmit={handleSubmit}
                // Enter in a text input must not submit this long form by accident
                onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
                }}
                className="flex flex-col gap-4"
            >
                <UITextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Personal website"
                />

                <RichTextEditor
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="What is this project about?"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <UITextField label="Start date" type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)} />
                    <UITextField label="End date (optional)" type="date" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} />
                </div>

                {isEdit && (
                    <div>
                        <p className="mb-1 text-sm text-[#A7B5AD]">Status</p>
                        <UISelect value={status} onChange={(v) => setStatus(v as ProjectStatus)}>
                            <UISelect.Option value="ACTIVE">Active</UISelect.Option>
                            <UISelect.Option value="DONE">Done</UISelect.Option>
                        </UISelect>
                    </div>
                )}

                {/* skills */}
                <div>
                    <p className="mb-2 text-sm text-[#A7B5AD]">Skills</p>
                    <UISelect
                        value=""
                        onChange={(v) => addTo(setSkillIds)(Number(v))}
                        placeholder={availableSkills.length ? "Add a skill..." : "All skills added"}
                        disabled={availableSkills.length === 0}
                    >
                        {availableSkills.map((s) => (
                            <UISelect.Option key={s.id} value={String(s.id)}>{s.name}</UISelect.Option>
                        ))}
                    </UISelect>
                    {pickedSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {pickedSkills.map((s) => (
                                <PickedChip key={s.id} label={s.name} dot={s.color} onRemove={() => removeFrom(setSkillIds)(s.id)} />
                            ))}
                        </div>
                    )}
                    <NewSkillInput
                        onCreate={async (name) => {
                            const created = await onCreateSkill(name);
                            if (created) addTo(setSkillIds)(created.id);
                        }}
                    />
                </div>

                {/* resources */}
                <div>
                    <p className="mb-2 text-sm text-[#A7B5AD]">Resources</p>
                    <UISelect
                        value=""
                        onChange={(v) => addTo(setResourceIds)(Number(v))}
                        placeholder={availableResources.length ? "Link a resource..." : "All resources linked"}
                        disabled={availableResources.length === 0}
                    >
                        {availableResources.map((r) => (
                            <UISelect.Option key={r.id} value={String(r.id)}>
                                {r.name} · {typeLabel(r.type)}
                            </UISelect.Option>
                        ))}
                    </UISelect>
                    {pickedResources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {pickedResources.map((r) => (
                                <PickedChip key={r.id} label={r.name} onRemove={() => removeFrom(setResourceIds)(r.id)} />
                            ))}
                        </div>
                    )}
                    <NewResourceForm
                        onCreate={async (p) => {
                            const created = await onCreateResource(p);
                            if (created) addTo(setResourceIds)(created.id);
                            return !!created;
                        }}
                    />
                </div>

                {/* notes */}
                {(!isEdit || projectNotes.length > 0) && (
                    <div>
                        <p className="mb-2 text-sm text-[#A7B5AD]">
                            {isEdit ? "Notes in this project" : "Notes"}
                        </p>

                        {!isEdit && (
                            <UISelect
                                value=""
                                onChange={(v) => addTo(setNoteIds)(Number(v))}
                                placeholder={availableNotes.length ? "Link an existing note..." : "No notes to link"}
                                disabled={availableNotes.length === 0}
                            >
                                {availableNotes.map((n) => (
                                    <UISelect.Option key={n.id} value={String(n.id)}>{n.title}</UISelect.Option>
                                ))}
                            </UISelect>
                        )}

                        {pickedNotes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {pickedNotes.map((n) => (
                                    <PickedChip key={n.id} label={n.title} onRemove={() => removeFrom(setNoteIds)(n.id)} />
                                ))}
                            </div>
                        )}

                        {notesToDelete.length > 0 && (
                            <p className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                {notesToDelete.length} note{notesToDelete.length > 1 ? "s" : ""} will be permanently
                                deleted when you save: {notesToDelete.map((n) => n.title).join(", ")}
                            </p>
                        )}
                        {isEdit && notesToDelete.length === 0 && (
                            <p className="mt-2 text-xs text-[#A7B5AD]">
                                Removing a note here deletes it permanently.
                            </p>
                        )}
                    </div>
                )}

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
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}