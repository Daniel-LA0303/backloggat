import { useEffect, useRef, useState } from "react";
import type { PasswordInfo, RevealData } from "../../interfaces/passwords.interfaces";
import Modal from "../Modal";
import UITextField from "../UITextField";

const SECONDS = 60;

type Props = {
  open: boolean;
  item: PasswordInfo | null;
  onClose: () => void;
  onReveal: (id: number, master: string) => Promise<RevealData | null>;
};

export function RevealModal({ open, item, onClose, onReveal }: Props) {
  const [master, setMaster] = useState("");
  const [data, setData] = useState<RevealData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(SECONDS);
  const [copied, setCopied] = useState("");

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // wipe everything every time the modal opens or closes
  useEffect(() => {
    setMaster("");
    setData(null);
    setError("");
    setLeft(SECONDS);
    setCopied("");
  }, [open, item]);

  // countdown, only while the values are visible
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          closeRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !master) return;

    setLoading(true);
    setError("");
    const res = await onReveal(item.id, master);
    setLoading(false);
    setMaster("");

    if (!res) return setError("Incorrect master password");
    setData(res);
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#A7B5AD]">{label}</p>
        <p className="num truncate text-sm text-[#F2F2F2]">{value || "—"}</p>
      </div>
      {value && (
        <button type="button" onClick={() => copy(label, value)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-[#A7B5AD] transition hover:bg-[#8FD3AE]/10 hover:text-[#8FD3AE]">
          {copied === label ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} className="w-full md:max-w-md" title={item?.name ?? "Password"}>
      {!data ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <UITextField label="Master password" type="password" value={master}
            onChange={(e) => setMaster(e.target.value)} />
          {error && <p className="text-xs text-red-300">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={loading || !master}
              className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-50">
              {loading ? "Checking..." : "Show"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {row("Username", data.site_username)}
          {row("Password", data.password)}

          <div className="mt-1 flex items-center justify-between text-xs text-[#A7B5AD]">
            <span>Closes in {left}s</span>
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm transition hover:bg-white/5">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}