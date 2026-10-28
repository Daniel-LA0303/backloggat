import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListFilters, type ListFiltersValue } from "../components/UIListFilters";
import type { KnowledgeInfo } from "../interfaces/knowledge.interfaces";
import { useApi } from "../context/ApiContext";
import type { SkillInfo } from "../interfaces/skills.interfaces";
import { useDebounce } from "../hooks/useDebounce";
import { KnowledgeFormModal, type KnowledgePayload } from "../components/knowledge/KnowledgeFormModal";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import Circles from "../components/Circles";
import { DockMenu } from "../components/DockMenu";
import { KnowledgeCard } from "../components/knowledge/KnowledgeCard";
import Modal from "../components/Modal";
import { getMenuItems } from "../utils/globalUtils";
import UIButton from "../components/UIButton";
import { PlusIcon } from "../utils/iconsUtils";

// + tus imports: useApi, Modal, DockMenu, Circles, GearIcon, ScreenSpinner, SkillInfo

type KnowledgeSortKey = "name" | "created_at";

const SORT_OPTIONS: { value: KnowledgeSortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
];

const DEFAULT_FILTERS: ListFiltersValue<KnowledgeSortKey> = {
  search: "",
  sortBy: "name",
  order: "asc",
};

const Knowledges = () => {
  const navigate = useNavigate();
  const { requestAuth } = useApi();

  const [items, setItems] = useState<KnowledgeInfo[]>([]);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeInfo | null>(null);
  const [toDelete, setToDelete] = useState<KnowledgeInfo | null>(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 300);
  const requestId = useRef(0);

  const fetchItems = useCallback(async () => {
    const id = ++requestId.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<KnowledgeInfo[]>(`/api/knowledges?${params}`, { method: "GET" });
    if (id !== requestId.current) return;

    setFirstLoad(false);
    if (data) setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // skills are only needed to link them when creating
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

  const openEdit = (k: KnowledgeInfo) => {
    setEditing(k);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: KnowledgePayload): Promise<boolean> => {
    const url = editing ? `/api/knowledges/${editing.id}` : "/api/knowledges";
    const data = await requestAuth<KnowledgeInfo>(url, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    if (!data) return false; // keep the modal open so the user can retry

    closeForm();
    await fetchItems();
    return true;
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await requestAuth(`/api/knowledges/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    await fetchItems();
  };

  if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

  const hasFilters = filters.search.trim() !== "";

  return (
    <>
      <div className="page-bg">
        <Circles />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

        <DockMenu items={getMenuItems(navigate)} />

        <div className="flex items-center justify-between gap-3">
          <p className="text-3xl">Your knowledge</p>
          <UIButton
            type="button"
            size="medium"
            leftIcon={<PlusIcon />}
            onClick={openCreate}
          >
            New knowledge
          </UIButton>
        </div>

        <ListFilters
          value={filters}
          onChange={setFilters}
          sortOptions={SORT_OPTIONS}
          searchPlaceholder="Search knowledge..."
        />

        {items.length === 0 && (
          <p className="text-center text-[#A7B5AD]">
            {hasFilters ? "No knowledge matches your search" : "No knowledge yet, create one"}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((k, index) => (
            <KnowledgeCard
              key={k.id}
              knowledge={k}
              index={index}
              // TODO: navigate(`/knowledge/${k.id}`) when the detail view exists
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      </main>

      <KnowledgeFormModal
        open={formOpen}
        knowledge={editing}
        skills={skills}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        className="w-full md:max-w-sm"
        title="Delete knowledge"
      >
        <div className="p-3">
          <p className="text-sm text-[#A7B5AD]">
            Delete <span className="text-[#F2F2F2]">{toDelete?.name}</span>? Its links to skills will
            be removed too.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setToDelete(null)}
              className="rounded-lg cursor-pointer px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-lg cursor-pointer border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Knowledges;