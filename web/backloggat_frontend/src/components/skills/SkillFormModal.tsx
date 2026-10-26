import { useEffect, useState } from "react";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import UITextField from "../UITextField";
import Modal from "../Modal";

export type SkillPayload = { name: string; color: string };

type SkillFormModalProps = {
  open: boolean;
  skill?: SkillInfo | null;
  onClose: () => void;
  onSubmit: (payload: SkillPayload) => Promise<boolean>;
};

const DEFAULT_COLOR = "#64748b";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function SkillFormModal({ open, skill, onClose, onSubmit }: SkillFormModalProps) {
  const isEdit = !!skill;

  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});
  const [saving, setSaving] = useState(false);

  // reset the form every time the modal opens
  useEffect(() => {
    if (!open) return;
    setName(skill?.name ?? "");
    setColor(skill?.color ?? DEFAULT_COLOR);
    setErrors({});
  }, [open, skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    const next: typeof errors = {};
    if (!trimmed) next.name = "Name is required";
    else if (trimmed.length > 50) next.name = "Name must be at most 50 characters";
    if (!HEX_RE.test(color)) next.color = "Color must be a hex value like #64748b";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    await onSubmit({ name: trimmed, color });
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full md:max-w-md"
      title={isEdit ? "Edit skill" : "New skill"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <UITextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Technology"
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