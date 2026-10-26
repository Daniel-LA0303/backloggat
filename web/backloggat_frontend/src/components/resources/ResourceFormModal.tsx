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
    link: string;
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
};

const LINK_RE = /^https?:\/\/\S+$/;

export function ResourceFormModal({ open, resource, skills, extra, onClose, onSubmit }: Props) {
    const isEdit = !!resource;

    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [type, setType] = useState<ResourceType>("article");
    const [skillIds, setSkillIds] = useState<number[]>([]);
    const [keptNotes, setKeptNotes] = useState<number[]>([]);
    const [keptProjects, setKeptProjects] = useState<number[]>([]);
    const [errors, setErrors] = useState<{ name?: string; link?: string }>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(resource?.name ?? "");
        setLink(resource?.link ?? "");
        setType(resource?.type ?? "article");
        setSkillIds(resource?.skills.map((s) => s.id) ?? []);
        setKeptNotes(resource?.noteIds ?? []);
        setKeptProjects(resource?.projectIds ?? []);
        setErrors({});
    }, [open, resource]);

    const addSkill = (id: number) =>
        setSkillIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    const removeSkill = (id: number) =>
        setSkillIds((prev) => prev.filter((x) => x !== id));

    const availableSkills = skills.filter((s) => !skillIds.includes(s.id));
    const pickedSkills = skills.filter((s) => skillIds.includes(s.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const n = name.trim();
        const l = link.trim();
        const next: typeof errors = {};
        if (!n) next.name = "Name is required";
        else if (n.length > 100) next.name = "Name must be 100 characters or less";
        if (!l) next.link = "Link is required";
        else if (!LINK_RE.test(l)) next.link = "Link must start with http:// or https://";

        setErrors(next);
        if (Object.keys(next).length > 0) return;

        const base = { name: n, link: l, type, skillsIds: skillIds };

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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    <UITextField
                        label="Link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://..."
                    />
                    {errors.link && <p className="mt-1 text-xs text-red-300">{errors.link}</p>}
                </div>

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