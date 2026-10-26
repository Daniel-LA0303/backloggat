import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListFilters, type ListFiltersValue } from "../components/UIListFilters";
import { useApi } from "../context/ApiContext";
import type { PasswordInfo, RevealData } from "../interfaces/passwords.interfaces";
import { useDebounce } from "../hooks/useDebounce";
import { PasswordFormModal, type PasswordPayload } from "../components/passwords/PasswordFormModal";
import Circles from "../components/Circles";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import { DockMenu } from "../components/DockMenu";
import { GearIcon } from "../utils/iconsUtils";
import { PasswordCard } from "../components/passwords/PasswordCard";
import { VaultSetupModal } from "../components/passwords/VaultSetupModal";
import { RevealModal } from "../components/passwords/RevealModal";
import Modal from "../components/Modal";

// + tus imports: useApi, Modal, DockMenu, Circles, GearIcon, ScreenSpinner

type SortKey = "name" | "created_at";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
];

const DEFAULT_FILTERS: ListFiltersValue<SortKey> = { search: "", sortBy: "name", order: "asc" };

const Passwords = () => {
  const navigate = useNavigate();
  const { requestAuth } = useApi();

  const [items, setItems] = useState<PasswordInfo[]>([]);
  const [hasVault, setHasVault] = useState<boolean | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [setupOpen, setSetupOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [revealing, setRevealing] = useState<PasswordInfo | null>(null);
  const [toDelete, setToDelete] = useState<PasswordInfo | null>(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 300);
  const requestId = useRef(0);

  const fetchItems = useCallback(async () => {
    const id = ++requestId.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<PasswordInfo[]>(`/api/passwords?${params}`, { method: "GET" });
    if (id !== requestId.current) return;

    setFirstLoad(false);
    if (data) setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const loadStatus = async () => {
      const data = await requestAuth<{ exists: boolean }>("/api/vault/status", { method: "GET" });
      setHasVault(data?.exists ?? false);
    };
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateVault = async (masterPassword: string): Promise<boolean> => {
    const res = await requestAuth("/api/vault", {
      method: "POST",
      body: JSON.stringify({ masterPassword }),
    });
    if (res === null || res === undefined) return false;
    setHasVault(true);
    setSetupOpen(false);
    return true;
  };

  const handleSave = async (payload: PasswordPayload): Promise<boolean> => {
    const data = await requestAuth<PasswordInfo>("/api/passwords", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!data) return false;

    setFormOpen(false);
    await fetchItems();
    return true;
  };

  const handleReveal = (id: number, masterPassword: string) =>
    requestAuth<RevealData>(`/api/passwords/${id}/reveal`, {
      method: "POST",
      body: JSON.stringify({ masterPassword }),
    });

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await requestAuth(`/api/passwords/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    await fetchItems();
  };

  // creating needs a vault first
  const openCreate = () => (hasVault ? setFormOpen(true) : setSetupOpen(true));

  if (firstLoad || hasVault === null) return <div className="h-screen"><ScreenSpinner /></div>;

  const hasFilters = filters.search.trim() !== "";

  return (
    <>
      <div className="page-bg">
        <Circles />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
        <DockMenu
          items={[
            { label: "Home", onClick: () => navigate("/") },
            { label: "Profile", onClick: () => navigate("/profile") },
            { label: "Settings", icon: <GearIcon size={16} />, onClick: () => navigate("/profile") },
          ]}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-3xl">Your passwords</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
          >
            + New password
          </button>
        </div>

        {!hasVault && (
          <div className="glass flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-[#F2F2F2]">Set a master password to start saving passwords</p>
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
            >
              Create master password
            </button>
          </div>
        )}

        <ListFilters
          value={filters}
          onChange={setFilters}
          sortOptions={SORT_OPTIONS}
          searchPlaceholder="Search passwords..."
        />

        {items.length === 0 && (
          <p className="text-center text-[#A7B5AD]">
            {hasFilters ? "No passwords match your search" : "No passwords yet, create one"}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((p, index) => (
            <PasswordCard
              key={p.id}
              item={p}
              index={index}
              onShow={setRevealing}
              onDelete={setToDelete}
            />
          ))}
        </div>
      </main>

      <VaultSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onSubmit={handleCreateVault} />

      <PasswordFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSave} />

      <RevealModal
        open={!!revealing}
        item={revealing}
        onClose={() => setRevealing(null)}
        onReveal={handleReveal}
      />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        className="w-full md:max-w-sm"
        title="Delete password"
      >
        <p className="text-sm text-[#A7B5AD]">
          Delete <span className="text-[#F2F2F2]">{toDelete?.name}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setToDelete(null)}
            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5">
            Cancel
          </button>
          <button type="button" onClick={handleConfirmDelete}
            className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20">
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Passwords;