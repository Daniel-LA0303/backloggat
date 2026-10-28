import { useEffect, useState } from "react";
import { typeLabel, type ResourceInfo } from "../../interfaces/resources.interfaces";
import type { NoteDetail } from "../../interfaces/notes.interfaces";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { RichTextEditor } from "../RichTextEditor";
import { UISelect } from "../UISelect";

export type NotePayload = {
  title: string;
  color: string;
  description: string;
  content: string;
  pinned: boolean;
  skillsIds: number[];
  resourcesIds: number[];
  projectId?: number;           // create from projects view
  removeProjectsIds?: number[]; // edit only
};

type Props = {
  open: boolean;
  note?: NoteDetail | null; // present = edit
  skills: SkillInfo[];
  resources: ResourceInfo[];
  extra?: { projectId?: number };
  onClose: () => void;
  defaultSkillIds?: number[];
  onSubmit: (payload: NotePayload) => Promise<boolean>;
};

const DEFAULT_COLOR = "#64748b";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function NoteFormModal({ open, note, skills, resources, extra, onClose, onSubmit, defaultSkillIds }: Props) {
  const isEdit = !!note;

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [resourceIds, setResourceIds] = useState<number[]>([]);
  const [keptProjects, setKeptProjects] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ title?: string; color?: string; description?: string }>({});
  const [saving, setSaving] = useState(false);

  // reset the form every time the modal opens
  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setColor(note?.color ?? DEFAULT_COLOR);
    setDescription(note?.description ?? "");
    setContent(note?.content ?? "");
    setPinned(note?.pinned ?? false);
    setSkillIds(note?.skills.map((s) => s.id) ?? defaultSkillIds ?? []);
    setResourceIds(note?.resources.map((r) => r.id) ?? []);
    setKeptProjects(note?.projectIds ?? []);
    setErrors({});
  }, [open, note]);

  const addSkill = (id: number) =>
    setSkillIds((p) => (p.includes(id) ? p : [...p, id]));
  const removeSkill = (id: number) => setSkillIds((p) => p.filter((x) => x !== id));

  const addResource = (id: number) =>
    setResourceIds((p) => (p.includes(id) ? p : [...p, id]));
  const removeResource = (id: number) => setResourceIds((p) => p.filter((x) => x !== id));

  const availableSkills = skills.filter((s) => !skillIds.includes(s.id));
  const pickedSkills = skills.filter((s) => skillIds.includes(s.id));
  const availableResources = resources.filter((r) => !resourceIds.includes(r.id));
  const pickedResources = resources.filter((r) => resourceIds.includes(r.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const t = title.trim();
    const d = description.trim();
    const next: typeof errors = {};
    if (!t) next.title = "Title is required";
    else if (t.length > 150) next.title = "Title must be 150 characters or less";
    if (!HEX_RE.test(color)) next.color = "Color must look like #64748b";
    if (d.length > 500) next.description = "Description must be 500 characters or less";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const base = {
      title: t,
      color,
      description: d,
      content,
      pinned,
      skillsIds: skillIds,
      resourcesIds: resourceIds,
    };

    const payload: NotePayload = note
      ? {
        ...base,
        removeProjectsIds: note.projectIds.filter((id) => !keptProjects.includes(id)),
      }
      : { ...base, ...extra };

    setSaving(true);
    await onSubmit(payload);
    setSaving(false);
  };

  const pickedChip = (
    key: number,
    label: string,
    onRemove: () => void,
    dotColor?: string,
  ) => (
    <span
      key={key}
      className="flex items-center gap-2 rounded-full border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 py-1 pl-3 pr-1.5 text-xs text-[#8FD3AE]"
    >
      {dotColor && <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} />}
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full md:max-w-3xl"
      title={isEdit ? "Edit note" : "New note"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">
        <div>
          <UITextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Go interfaces"
          />
          {errors.title && <p className="mt-1 text-xs text-red-300">{errors.title}</p>}
        </div>

        <div>
          <div className="flex items-end gap-3">
            <input
              type="color"
              value={HEX_RE.test(color) ? color : DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Pick a color"
              className="h-11  w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/20 p-1"
            />
            <div className="flex-1">
              <UITextField
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#64748b"
              />
            </div>
          </div>
          {errors.color && <p className="mt-1 text-xs text-red-300">{errors.color}</p>}
        </div>

        <div>
          <UITextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary shown on the card"
            multiline={true}
            rows={3}
          />
          {errors.description && <p className="mt-1 text-xs text-red-300">{errors.description}</p>}
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
                {pickedSkills.map((s) => pickedChip(s.id, s.name, () => removeSkill(s.id), s.color))}
              </div>
            )}
          </div>
        )}

        {resources.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-[#A7B5AD]">Resources</p>
            <UISelect
              value=""
              onChange={(v) => addResource(Number(v))}
              placeholder={availableResources.length ? "Add a resource..." : "All resources added"}
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
                {pickedResources.map((r) => pickedChip(r.id, r.name, () => removeResource(r.id)))}
              </div>
            )}
          </div>
        )}

        {/* projects can only be unlinked, never added from here */}
        {isEdit && keptProjects.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-[#A7B5AD]">Linked projects (click × to unlink)</p>
            <div className="flex flex-wrap gap-2">
              {keptProjects.map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-xs text-[#F2F2F2]"
                >
                  Project #{id}
                  <button
                    type="button"
                    onClick={() => setKeptProjects((p) => p.filter((x) => x !== id))}
                    aria-label={`Unlink project ${id}`}
                    className="grid size-5 place-items-center rounded-full text-[#A7B5AD] transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#A7B5AD]">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="size-4 accent-[#8FD3AE]"
          />
          Pin this note
        </label>

        <RichTextEditor
          label="Content"
          value={content}
          onChange={setContent}
          placeholder="Write your note..."
        />

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
            className="rounded-lg border cursor-pointer border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}