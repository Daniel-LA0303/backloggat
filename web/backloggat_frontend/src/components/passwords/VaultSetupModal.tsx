import { useEffect, useState } from "react";
import Modal from "../Modal";
import UITextField from "../UITextField";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (masterPassword: string) => Promise<boolean>;
};

export function VaultSetupModal({ open, onClose, onSubmit }: Props) {
  const [master, setMaster] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMaster("");
    setConfirm("");
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (master.length < 8) return setError("Use at least 8 characters");
    if (master !== confirm) return setError("Passwords do not match");

    setError("");
    setSaving(true);
    await onSubmit(master);
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full md:max-w-md" title="Create master password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-[#A7B5AD]">
          This password protects all the others. If you forget it, they cannot be recovered.
        </p>

        <UITextField label="Master password" type="password" value={master}
          onChange={(e) => setMaster(e.target.value)} />
        <UITextField label="Confirm" type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} />

        {error && <p className="text-xs text-red-300">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50">
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}