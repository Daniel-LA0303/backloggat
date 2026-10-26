import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


import { ListFilters, type ListFiltersValue } from "../components/UIListFilters";
import { useApi } from "../context/ApiContext";
import { 
      RESOURCE_TYPES,
  type ResourceDetail,
  type ResourceInfo,
 } from "../interfaces/resources.interfaces";
import type { SkillInfo } from "../interfaces/skills.interfaces";
import { useDebounce } from "../hooks/useDebounce";
import { ResourceFormModal, type ResourcePayload } from "../components/resources/ResourceFormModal";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import Circles from "../components/Circles";
import { DockMenu } from "../components/DockMenu";
import { GearIcon } from "../utils/iconsUtils";
import { ResourceRow } from "../components/resources/ResourceRow";
import Modal from "../components/Modal";
// + tus imports: useApi, Modal, DockMenu, Circles, GearIcon, ScreenSpinner, SkillInfo

type SortKey = "name" | "created_at" | "type";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
  { value: "type", label: "Type" },
];

const DEFAULT_FILTERS: ListFiltersValue<SortKey> = { search: "", sortBy: "name", order: "asc" };

const Resources = () => {
  const navigate = useNavigate();
  const { requestAuth } = useApi();

  const [items, setItems] = useState<ResourceInfo[]>([]);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [typeFilter, setTypeFilter] = useState(""); // "" = all

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceDetail | null>(null);
  const [toDelete, setToDelete] = useState<ResourceInfo | null>(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 300);
  const requestId = useRef(0);

  const fetchItems = useCallback(async () => {
    const id = ++requestId.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (typeFilter) params.set("type", typeFilter);
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<ResourceInfo[]>(`/api/resources?${params}`, { method: "GET" });
    if (id !== requestId.current) return;

    setFirstLoad(false);
    if (data) setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const loadSkills = async () => {
      const data = await requestAuth<SkillInfo[]>("/api/skills", { method: "GET" });
      if (data) setSkills(data);
    };
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // the edit modal needs the current links, so fetch the detail first
  const openEdit = async (r: ResourceInfo) => {
    const detail = await requestAuth<ResourceDetail>(`/api/resources/${r.id}`, { method: "GET" });
    if (!detail) return;
    setEditing(detail);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: ResourcePayload): Promise<boolean> => {
    const url = editing ? `/api/resources/${editing.id}` : "/api/resources";
    const data = await requestAuth<ResourceInfo>(url, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    if (!data) return false;

    closeForm();
    await fetchItems(); // refresh counters
    return true;
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await requestAuth(`/api/resources/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    await fetchItems();
  };

  if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

  const hasFilters = filters.search.trim() !== "" || typeFilter !== "";

  const typeChip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-[#8FD3AE]/50 bg-[#8FD3AE]/10 text-[#8FD3AE]"
        : "border-white/10 bg-white/5 text-[#A7B5AD] hover:border-white/20"
    }`;

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
          <p className="text-3xl">Your resources</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
          >
            + New resource
          </button>
        </div>

        <ListFilters
          value={filters}
          onChange={setFilters}
          sortOptions={SORT_OPTIONS}
          searchPlaceholder="Search by name or link..."
        />

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTypeFilter("")} className={typeChip(typeFilter === "")}>
            All
          </button>
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
              aria-pressed={typeFilter === t.value}
              className={typeChip(typeFilter === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-center text-[#A7B5AD]">
            {hasFilters ? "No resources match your filters" : "No resources yet, create one"}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {items.map((r, index) => (
            <ResourceRow
              key={r.id}
              item={r}
              index={index}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      </main>

      <ResourceFormModal
        open={formOpen}
        resource={editing}
        skills={skills}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        className="w-full md:max-w-sm"
        title="Delete resource"
      >
        <p className="text-sm text-[#A7B5AD]">
          Delete <span className="text-[#F2F2F2]">{toDelete?.name}</span>? Its links to skills,
          notes and projects will be removed too.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setToDelete(null)}
            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Resources;