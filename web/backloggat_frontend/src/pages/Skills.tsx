import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListFilters, type ListFiltersValue } from "../components/UIListFilters";
import { useApi } from "../hooks/useApi";
import type { SkillInfo } from "../interfaces/skills.interfaces";
import { useDebounce } from "../hooks/useDebounce";
import { SkillFormModal, type SkillPayload } from "../components/skills/SkillFormModal";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import Circles from "../components/Circles";
import { DockMenu } from "../components/DockMenu";
import { SkillCard } from "../components/skills/SkillCard";
import Modal from "../components/Modal";
import UIButton from "../components/UIButton";
import { getMenuItems } from "../utils/globalUtils";


// + tus imports: useApi, Modal, DockMenu, Circles, GearIcon, ScreenSpinner, SkillInfo

type SkillSortKey = "name" | "created_at";

const SORT_OPTIONS: { value: SkillSortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
];

const DEFAULT_FILTERS: ListFiltersValue<SkillSortKey> = {
  search: "",
  sortBy: "name",
  order: "asc",
};

const Skills = () => {
  const navigate = useNavigate();
  const { requestAuth } = useApi();

  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SkillInfo | null>(null);
  const [toDelete, setToDelete] = useState<SkillInfo | null>(null);

  // only the search text is debounced; sort changes apply immediately
  const debouncedSearch = useDebounce(filters.search.trim(), 300);

  // ignore responses that arrive out of order
  const requestId = useRef(0);

  const fetchSkills = useCallback(async () => {
    const id = ++requestId.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<SkillInfo[]>(`/api/skills?${params}`, { method: "GET" });
    if (id !== requestId.current) return;

    setFirstLoad(false);
    if (data) setSkills(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (skill: SkillInfo) => {
    setEditing(skill);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (payload: SkillPayload): Promise<boolean> => {
    const url = editing ? `/api/skills/${editing.id}` : "/api/skills";
    const data = await requestAuth<SkillInfo>(url, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    if (!data) return false; // keep the modal open so the user can retry

    closeForm();
    await fetchSkills(); // refresh so counters and order are correct
    return true;
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await requestAuth(`/api/skills/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    await fetchSkills();
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
          <p className="text-3xl">Your skills</p>
          <UIButton
            onClick={openCreate}
          >
            + New skill
          </UIButton>

        </div>

        <ListFilters
          value={filters}
          onChange={setFilters}
          sortOptions={SORT_OPTIONS}
          searchPlaceholder="Search skills..."
        />

        {skills.length === 0 && (
          <p className="text-center text-[#A7B5AD]">
            {hasFilters ? "No skills match your search" : "No skills yet, create one"}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {skills.map((s, index) => (
            <SkillCard
              key={s.id}
              skill={s}
              index={index}
              onClick={(sk) => navigate(`/skills/${sk.id}`)}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      </main>

      <SkillFormModal
        open={formOpen}
        skill={editing}
        onClose={closeForm}
        onSubmit={handleSave}
      />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        className="w-full md:max-w-sm"
        title="Delete skill"
      >
        <p className="text-sm text-[#A7B5AD]">
          Delete <span className="text-[#F2F2F2]">{toDelete?.name}</span>? Its links to projects,
          notes, resources and knowledge will be removed too.
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

export default Skills;