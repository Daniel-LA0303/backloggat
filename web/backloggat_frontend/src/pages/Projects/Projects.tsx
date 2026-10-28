import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListFilters, type ListFiltersValue } from "../../components/UIListFilters";
import { useProjectOptions } from "../../hooks/useProjectOptions";
import { useApi } from "../../context/ApiContext";
import type { ProjectInfo } from "../../interfaces/projects.interfaces";
import { useDebounce } from "../../hooks/useDebounce";
import { ProjectFormModal, type ProjectPayload } from "../../components/projects/ProjectFormModal";
import { ScreenSpinner } from "../../components/ScreenSpinnerProps";
import Circles from "../../components/Circles";
import { DockMenu } from "../../components/DockMenu";
import { SearchableSelect } from "../../components/notes/SearchableSelect";
import { ProjectCard } from "../../components/projects/ProjectCard";
import Modal from "../../components/Modal";
import { getMenuItems } from "../../utils/globalUtils";
import UIButton from "../../components/UIButton";
import { DeleteIcon, PlusIcon } from "../../utils/iconsUtils";


type SortKey = "updated_at" | "created_at" | "title" | "start_date" | "progress";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "updated_at", label: "Updated" },
    { value: "created_at", label: "Created" },
    { value: "title", label: "Title" },
    { value: "start_date", label: "Start date" },
    { value: "progress", label: "Progress" },
];

const DEFAULT_FILTERS: ListFiltersValue<SortKey> = { search: "", sortBy: "updated_at", order: "desc" };

const STATUS_CHIPS = [
    { value: "", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "DONE", label: "Done" },
];

const Projects = () => {
    const navigate = useNavigate();
    const { requestAuth } = useApi();
    const { skills, notes, resources, createSkill, createResource } = useProjectOptions();

    const [items, setItems] = useState<ProjectInfo[]>([]);
    const [firstLoad, setFirstLoad] = useState(true);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [statusFilter, setStatusFilter] = useState("");
    const [skillFilter, setSkillFilter] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [toDelete, setToDelete] = useState<ProjectInfo | null>(null);

    const debouncedSearch = useDebounce(filters.search.trim(), 300);
    const requestId = useRef(0);

    const fetchItems = useCallback(async () => {
        const id = ++requestId.current;

        // every param is set BEFORE the request
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (statusFilter) params.set("status", statusFilter);
        if (skillFilter) params.set("skill_id", skillFilter);
        params.set("sort_by", filters.sortBy);
        params.set("order", filters.order);

        const data = await requestAuth<ProjectInfo[]>(`/api/projects?${params}`, { method: "GET" });
        if (id !== requestId.current) return;

        setFirstLoad(false);
        if (data) setItems(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, statusFilter, skillFilter, filters.sortBy, filters.order]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleCreate = async (payload: ProjectPayload): Promise<boolean> => {
        const data = await requestAuth<ProjectInfo>("/api/projects", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        if (!data) return false;

        setFormOpen(false);
        navigate(`/projects/${data.id}`);
        return true;
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        await requestAuth(`/api/projects/${toDelete.id}`, { method: "DELETE" });
        setToDelete(null);
        await fetchItems();
    };

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    const hasFilters = filters.search.trim() !== "" || statusFilter !== "" || skillFilter !== "";

    const chip = (active: boolean) =>
        `rounded-full border px-3 py-1 text-xs transition ${active
            ? "border-[#8FD3AE]/50 bg-[#8FD3AE]/10 text-[#8FD3AE]"
            : "border-white/10 bg-white/5 text-[#A7B5AD] hover:border-white/20"
        }`;

    return (
        <div className="h-screen">
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

                <DockMenu items={getMenuItems(navigate)} />

                <div className="flex items-center justify-between gap-3">
                    <p className="text-3xl">Your projects</p>
                    
                    <UIButton
                        type="button"
                        leftIcon={<PlusIcon />}
                        size="medium"
                        onClick={() => setFormOpen(true)}
                    >
                        New project
                    </UIButton>
                </div>

                <ListFilters
                    value={filters}
                    onChange={setFilters}
                    sortOptions={SORT_OPTIONS}
                    searchPlaceholder="Search projects..."
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2">
                        {STATUS_CHIPS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setStatusFilter(c.value)}
                                aria-pressed={statusFilter === c.value}
                                className={`${chip(statusFilter === c.value)} cursor-pointer `}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    <SearchableSelect
                        className="w-full sm:w-64 "
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
                            className="text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2] cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {items.length === 0 && (
                    <p className="text-center text-[#A7B5AD]">
                        {hasFilters ? "No projects match your filters" : "No projects yet, create one"}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((p, index) => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            index={index}
                            onClick={(x) => navigate(`/projects/${x.id}`)}
                            onDelete={setToDelete}
                        />
                    ))}
                </div>
            </main>

            <ProjectFormModal
                open={formOpen}
                skills={skills}
                notes={notes}
                resources={resources}
                onCreateSkill={createSkill}
                onCreateResource={createResource}
                onClose={() => setFormOpen(false)}
                onSubmit={handleCreate}
            />

            <Modal
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                className="w-full md:max-w-sm"
                title="Delete project"
            >
                <div className="p-3">
                    <p className="text-sm text-[#A7B5AD]">
                        Delete <span className="text-[#F2F2F2]">{toDelete?.title}</span>? Its tasks are deleted,
                        except those that are also in a daily list. Notes and resources are kept, only unlinked.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setToDelete(null)}
                            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="rounded-lg border flex items-center border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20 cursor-pointer"
                        >
                            <DeleteIcon />
                            <span className="ml-2">Delete</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;