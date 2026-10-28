import { useEffect, useState } from "react";
import type { KnowledgeInfo } from "../../interfaces/knowledge.interfaces";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import Modal from "../Modal";
import UITextField from "../UITextField";
import { RichTextEditor } from "../RichTextEditor";

export type KnowledgePayload = {
  name: string;
  description: string;
  color: string;
  skillsIds?: number[];
};

type Props = {
  open: boolean;
  knowledge?: KnowledgeInfo | null;
  defaultSkillIds?: number[];
  skills: SkillInfo[]; // available skills to link (create only)
  onClose: () => void;
  onSubmit: (payload: KnowledgePayload) => Promise<boolean>;
};

const DEFAULT_COLOR = "#64748b";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function KnowledgeFormModal({ open, knowledge, skills, onClose, onSubmit, defaultSkillIds }: Props) {
  const isEdit = !!knowledge;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(knowledge?.name ?? "");
    setDescription(knowledge?.description ?? "");
    setColor(knowledge?.color ?? DEFAULT_COLOR);
    setSkillIds(defaultSkillIds ?? []);
    setErrors({});
  }, [open, knowledge]);

  const toggleSkill = (id: number) =>
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    const next: typeof errors = {};
    if (!trimmed) next.name = "Name is required";
    else if (trimmed.length > 100) next.name = "Name must be 100 characters or less";
    if (!HEX_RE.test(color)) next.color = "Color must look like #64748b";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    await onSubmit({
      name: trimmed,
      description,
      color,
      ...(isEdit ? {} : { skillsIds: skillIds }),
    });
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full md:max-w-2xl"
      title={isEdit ? "Edit knowledge" : "New knowledge"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-3">
        <div>
          <UITextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Docker networking"
          />
          {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
        </div>

        <div>
          <div className="flex items-end gap-3">
            <input
              type="color"
              value={HEX_RE.test(color) ? color : DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Pick a color"
              className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/20 p-1"
            />
            <div className="flex-1">
              <UITextField
                label="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#64748b"
              />
            </div>
          </div>
          {errors.color && <p className="mt-1 text-xs text-red-300">{errors.color}</p>}
        </div>

        <RichTextEditor
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="What did you learn?"
        />

        {!isEdit && skills.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-[#A7B5AD]">Linked skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const active = skillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active
                        ? "border-[#8FD3AE]/50 bg-[#8FD3AE]/10 text-[#8FD3AE]"
                        : "border-white/10 bg-white/5 text-[#A7B5AD] hover:border-white/20"
                      }`}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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