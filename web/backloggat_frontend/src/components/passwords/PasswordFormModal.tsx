import { useEffect, useState } from "react";
import UITextField from "../UITextField";
import Modal from "../Modal";


export type PasswordPayload = {
  name: string;
  siteUsername: string;
  url: string;
  color: string;
  password: string;
  masterPassword: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PasswordPayload) => Promise<boolean>;
};

const DEFAULT_COLOR = "#64748b";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const EMPTY: PasswordPayload = {
  name: "", siteUsername: "", url: "", color: DEFAULT_COLOR, password: "", masterPassword: "",
};

export function PasswordFormModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<PasswordPayload>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordPayload, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setErrors({});
  }, [open]);

  const set = (k: keyof PasswordPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!HEX_RE.test(form.color)) next.color = "Color must look like #64748b";
    if (!form.password) next.password = "Password is required";
    if (!form.masterPassword) next.masterPassword = "Master password is required";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const ok = await onSubmit({ ...form, name: form.name.trim() });
    setSaving(false);

    // never keep the master password in state after sending it
    if (!ok) setForm((f) => ({ ...f, masterPassword: "" }));
  };

  const err = (k: keyof PasswordPayload) =>
    errors[k] && <p className="mt-1 text-xs text-red-300">{errors[k]}</p>;

  return (
    <Modal open={open} onClose={onClose} className="w-full md:max-w-lg" title="New password">
      <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4 p-3">
        <div>
          <UITextField label="Name" value={form.name} onChange={set("name")} placeholder="e.g. Gmail" />
          {err("name")}
        </div>

        <UITextField label="Username / email" value={form.siteUsername} onChange={set("siteUsername")}
          placeholder="test1@gmail.com" />

        <UITextField label="URL" value={form.url} onChange={set("url")} placeholder="https://mail.google.com" />

        <div>
          <div className="flex items-end gap-3">
            <input
              type="color"
              value={HEX_RE.test(form.color) ? form.color : DEFAULT_COLOR}
              onChange={set("color")}
              aria-label="Pick a color"
              className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/20 p-1"
            />
            <div className="flex-1">
              <UITextField value={form.color} onChange={set("color")} placeholder="#64748b" />
            </div>
          </div>
          {err("color")}
        </div>

        <div>
          <UITextField label="Password" type="password" value={form.password} onChange={set("password")} />
          {err("password")}
        </div>

        <div>
          <UITextField label="Master password" type="password" value={form.masterPassword}
            onChange={set("masterPassword")} />
          {err("masterPassword")}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg px-4 cursor-pointer py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg border cursor-pointer  border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50">
            {saving ? "Encrypting..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}