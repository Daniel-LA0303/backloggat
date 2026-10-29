import { useEffect, useState } from "react";

import {
    RESOURCE_TYPES,
    type ResourceDetail,
    type ResourceType,
} from "../../interfaces/resources.interfaces";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { UISelect } from "../UISelect";

export type ResourcePayload = {
    name: string;
    link: string;                 // vacío si hay file
    file?: File;                  // si existe, el back genera el link con Drive
    type: ResourceType;
    skillsIds: number[];
    noteId?: number;              // create only, when created from a note
    projectId?: number;           // create only, when created from a project
    removeNotesIds?: number[];    // edit only
    removeProjectsIds?: number[]; // edit only
};

type Props = {
    open: boolean;
    resource?: ResourceDetail | null; // present = edit
    skills: SkillInfo[];
    extra?: { noteId?: number; projectId?: number };
    onClose: () => void;
    onSubmit: (payload: ResourcePayload) => Promise<boolean>;
    defaultSkillIds?: number[];
};

type FormErrors = { name?: string; link?: string; file?: string };

const LINK_RE = /^https?:\/\/\S+$/;
const MAX_FILE_MB = 50; // igual que maxUploadSize del back

const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function ResourceFormModal({ open, resource, skills, extra, onClose, onSubmit, defaultSkillIds }: Props) {
    const isEdit = !!resource;

    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [type, setType] = useState<ResourceType>("article");
    const [skillIds, setSkillIds] = useState<number[]>([]);
    const [keptNotes, setKeptNotes] = useState<number[]>([]);
    const [keptProjects, setKeptProjects] = useState<number[]>([]);
    const [mode, setMode] = useState<"link" | "file">("link");
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(resource?.name ?? "");
        setLink(resource?.link ?? "");
        setType(resource?.type ?? "article");
        setSkillIds(resource?.skills.map((s) => s.id) ?? defaultSkillIds ?? []);
        setKeptNotes(resource?.noteIds ?? []);
        setKeptProjects(resource?.projectIds ?? []);
        setMode("link");
        setFile(null);
        setDragging(false);
        setErrors({});
    }, [open, resource]);

    const addSkill = (id: number) =>
        setSkillIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    const removeSkill = (id: number) =>
        setSkillIds((prev) => prev.filter((x) => x !== id));

    const availableSkills = skills.filter((s) => !skillIds.includes(s.id));
    const pickedSkills = skills.filter((s) => skillIds.includes(s.id));

    const pickFile = (f: File | undefined) => {
        if (!f) return;
        if (f.size > MAX_FILE_MB * 1024 * 1024) {
            setErrors((p) => ({ ...p, file: `File must be ${MAX_FILE_MB} MB or less` }));
            return;
        }
        setErrors((p) => ({ ...p, file: undefined }));
        setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const n = name.trim();
        const l = link.trim();
        const next: FormErrors = {};
        if (!n) next.name = "Name is required";
        else if (n.length > 100) next.name = "Name must be 100 characters or less";

        if (mode === "file") {
            if (!file) next.file = "Select a file";
        } else {
            if (!l) next.link = "Link is required";
            else if (!LINK_RE.test(l)) next.link = "Link must start with http:// or https://";
        }

        setErrors(next);
        if (Object.keys(next).length > 0) return;

        const base = {
            name: n,
            link: mode === "link" ? l : "",
            file: mode === "file" ? file! : undefined,
            type,
            skillsIds: skillIds,
        };

        const payload: ResourcePayload = resource
            ? {
                ...base,
                removeNotesIds: resource.noteIds.filter((id) => !keptNotes.includes(id)),
                removeProjectsIds: resource.projectIds.filter((id) => !keptProjects.includes(id)),
            }
            : { ...base, ...extra };

        setSaving(true);
        await onSubmit(payload);
        setSaving(false);
    };

    const chip = (active: boolean) =>
        `flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active
            ? "border-[#8FD3AE]/50 bg-[#8FD3AE]/10 text-[#8FD3AE]"
            : "border-white/10 bg-white/5 text-[#A7B5AD] hover:border-white/20"
        }`;

    const removable = (
        label: string,
        ids: number[],
        prefix: string,
        onRemove: (id: number) => void,
    ) =>
        ids.length > 0 && (
            <div>
                <p className="mb-2 text-sm text-[#A7B5AD]">{label}</p>
                <div className="flex flex-wrap gap-2">
                    {ids.map((id) => (
                        <span
                            key={id}
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-xs text-[#F2F2F2]"
                        >
                            {prefix} #{id}
                            <button
                                type="button"
                                onClick={() => onRemove(id)}
                                aria-label={`Remove ${prefix} ${id}`}
                                className="grid size-5 place-items-center rounded-full text-[#A7B5AD] transition hover:bg-red-500/10 hover:text-red-300"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        );

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="w-full md:max-w-lg"
            title={isEdit ? "Edit resource" : "New resource"}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">

                {skills.length > 0 && (
                    <div>
                        <p className="mb-2 text-sm text-[#A7B5AD]">Skills</p>

                        <UISelect
                            value=""
                            onChange={(v) => addSkill(Number(v))}
                            placeholder={availableSkills.length ? "Add a skill..." : "All skills added"}
                            disabled={availableSkills.length === 0}
                        >
                            {availableSkills.map((s) => (
                                <UISelect.Option key={s.id} value={String(s.id)}>
                                    {s.name}
                                </UISelect.Option>
                            ))}
                        </UISelect>

                        {pickedSkills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {pickedSkills.map((s) => (
                                    <span
                                        key={s.id}
                                        className="flex items-center gap-2 rounded-full border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 py-1 pl-3 pr-1.5 text-xs text-[#8FD3AE]"
                                    >
                                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        {s.name}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(s.id)}
                                            aria-label={`Remove ${s.name}`}
                                            className="grid size-5 place-items-center rounded-full transition hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <p className="mb-1 text-sm text-[#A7B5AD]">Type</p>
                    <UISelect value={type} onChange={(v) => setType(v as ResourceType)}>
                        {RESOURCE_TYPES.map((t) => (
                            <UISelect.Option key={t.value} value={t.value}>
                                {t.label}
                            </UISelect.Option>
                        ))}
                    </UISelect>
                </div>

                {isEdit && (
                    <>
                        {removable("Linked notes (click × to unlink)", keptNotes, "Note", (id) =>
                            setKeptNotes((p) => p.filter((x) => x !== id)),
                        )}
                        {removable("Linked projects (click × to unlink)", keptProjects, "Project", (id) =>
                            setKeptProjects((p) => p.filter((x) => x !== id)),
                        )}
                    </>
                )}

                <div>
                    <UITextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Go concurrency patterns"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
                </div>

                <div>
                    <p className="mb-2 text-sm text-[#A7B5AD]">Source</p>

                    <div className="mb-3 flex gap-2">
                        {(["link", "file"] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`cursor-pointer ${chip(mode === m)}`}
                            >
                                {m === "link" ? "Link" : "Upload file"}
                            </button>
                        ))}
                    </div>

                    {mode === "link" ? (
                        <>
                            <UITextField
                                label="Link"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://..."
                            />
                            {errors.link && <p className="mt-1 text-xs text-red-300">{errors.link}</p>}
                        </>
                    ) : (
                        <>
                            <label
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragging(false);
                                    pickFile(e.dataTransfer.files[0]);
                                }}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center text-sm transition ${dragging
                                    ? "border-[#8FD3AE]/60 bg-[#8FD3AE]/10 text-[#8FD3AE]"
                                    : "border-white/15 bg-white/5 text-[#A7B5AD] hover:border-white/30"
                                    }`}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        pickFile(e.target.files?.[0]);
                                        e.target.value = ""; // permite volver a elegir el mismo archivo
                                    }}
                                />
                                {file ? (
                                    <>
                                        <span className="text-[#F2F2F2]">{file.name}</span>
                                        <span className="text-xs">{formatSize(file.size)} · click or drop to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Drop a file here or click to browse</span>
                                        <span className="text-xs">Max {MAX_FILE_MB} MB</span>
                                    </>
                                )}
                            </label>

                            {file && (
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="mt-2 cursor-pointer text-xs text-[#A7B5AD] transition hover:text-red-300"
                                >
                                    Remove file
                                </button>
                            )}
                            {errors.file && <p className="mt-1 text-xs text-red-300">{errors.file}</p>}

                            {isEdit && resource?.link && (
                                <p className="mt-2 text-xs text-[#A7B5AD]">
                                    Uploading a new file will replace the current resource.
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-2 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg cursor-pointer px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg cursor-pointer border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}