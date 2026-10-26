import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListFilters, type ListFiltersValue } from "../components/UIListFilters";
import { useApi } from "../context/ApiContext";
import type { NoteDetail, NoteInfo } from "../interfaces/notes.interfaces";
import type { ResourceInfo } from "../interfaces/resources.interfaces";
import type { SkillInfo } from "../interfaces/skills.interfaces";
import { useDebounce } from "../hooks/useDebounce";
import { NoteFormModal, type NotePayload } from "../components/notes/NoteFormModal";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import { DockMenu } from "../components/DockMenu";
import Circles from "../components/Circles";
import { GearIcon } from "../utils/iconsUtils";
import { NoteCard } from "../components/notes/NoteCard";
import Modal from "../components/Modal";
import { SearchableSelect } from "../components/notes/SearchableSelect";

// + tus imports: useApi, Modal, DockMenu, Circles, GearIcon, ScreenSpinner, SkillInfo

type SortKey = "updated_at" | "created_at" | "title";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "updated_at", label: "Updated" },
    { value: "created_at", label: "Created" },
    { value: "title", label: "Title" },
];

// notes default to most recently updated first
const DEFAULT_FILTERS: ListFiltersValue<SortKey> = {
    search: "",
    sortBy: "updated_at",
    order: "desc",
};

const Notes = () => {
    const navigate = useNavigate();
    const { requestAuth } = useApi();

    const [items, setItems] = useState<NoteInfo[]>([]);
    const [skills, setSkills] = useState<SkillInfo[]>([]);
    const [resources, setResources] = useState<ResourceInfo[]>([]);
    const [firstLoad, setFirstLoad] = useState(true);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<NoteDetail | null>(null);
    const [toDelete, setToDelete] = useState<NoteInfo | null>(null);

    const debouncedSearch = useDebounce(filters.search.trim(), 300);
    const requestId = useRef(0);

    const [skillFilter, setSkillFilter] = useState("");

const fetchItems = useCallback(async () => {
    const id = ++requestId.current;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (skillFilter) params.set("skill_id", skillFilter); // antes de la petición
    params.set("sort_by", filters.sortBy);
    params.set("order", filters.order);

    const data = await requestAuth<NoteInfo[]>(`/api/notes?${params}`, { method: "GET" });
    if (id !== requestId.current) return;

    setFirstLoad(false);
    if (data) setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearch, skillFilter, filters.sortBy, filters.order]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // options for the selects in the modal
    useEffect(() => {
        const loadOptions = async () => {
            const [s, r] = await Promise.all([
                requestAuth<SkillInfo[]>("/api/skills", { method: "GET" }),
                requestAuth<ResourceInfo[]>("/api/resources", { method: "GET" }),
            ]);
            if (s) setSkills(s);
            if (r) setResources(r);
        };
        loadOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    // the edit modal needs content and current links, so fetch the detail first
    const openEdit = async (n: NoteInfo) => {
        const detail = await requestAuth<NoteDetail>(`/api/notes/${n.id}`, { method: "GET" });
        if (!detail) return;
        setEditing(detail);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
    };

    const handleSave = async (payload: NotePayload): Promise<boolean> => {
        const url = editing ? `/api/notes/${editing.id}` : "/api/notes";
        const data = await requestAuth<NoteInfo>(url, {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(payload),
        });
        if (!data) return false; // keep the modal open so the user can retry

        closeForm();
        await fetchItems(); // refresh counters and order
        return true;
    };

    const handlePin = async (n: NoteInfo) => {
        await requestAuth(`/api/notes/${n.id}/pin`, {
            method: "PATCH",
            body: JSON.stringify({ pinned: !n.pinned }),
        });
        await fetchItems();
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        await requestAuth(`/api/notes/${toDelete.id}`, { method: "DELETE" });
        setToDelete(null);
        await fetchItems();
    };

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    const hasFilters = filters.search.trim() !== "" || skillFilter !== "";

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
                    <p className="text-3xl">Your notes</p>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
                    >
                        + New note
                    </button>
                </div>

                <ListFilters
                    value={filters}
                    onChange={setFilters}
                    sortOptions={SORT_OPTIONS}
                    searchPlaceholder="Search by title or description..."
                />

                <div className="flex items-center gap-3">
                    <SearchableSelect
                        className="w-full sm:w-72"
                        value={skillFilter}
                        onChange={setSkillFilter}
                        placeholder="Filter by skill"
                        allLabel="All skills"
                        options={skills.map((s) => ({ value: String(s.id), label: s.name, color: s.color }))}
                    />
                    {skillFilter && (
                        <button
                            type="button"
                            onClick={() => setSkillFilter("")}
                            className="text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2]"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {items.length === 0 && (
                    <p className="text-center text-[#A7B5AD]">
                        {hasFilters ? "No notes match your search" : "No notes yet, create one"}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((n, index) => (
                        <NoteCard
                            key={n.id}
                            note={n}
                            index={index}
                            // TODO: navigate(`/notes/${n.id}`) when the detail view exists
                            onPin={handlePin}
                            onEdit={openEdit}
                            onDelete={setToDelete}
                        />
                    ))}
                </div>
            </main>

            <NoteFormModal
                open={formOpen}
                note={editing}
                skills={skills}
                resources={resources}
                onClose={closeForm}
                onSubmit={handleSave}
            />

            <Modal
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                className="w-full md:max-w-sm"
                title="Delete note"
            >
                <p className="text-sm text-[#A7B5AD]">
                    Delete <span className="text-[#F2F2F2]">{toDelete?.title}</span>? Its links to skills,
                    resources and projects will be removed too.
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

export default Notes;