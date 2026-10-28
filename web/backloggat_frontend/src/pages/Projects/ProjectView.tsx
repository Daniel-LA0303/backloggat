import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import { useProjectOptions } from "../../hooks/useProjectOptions";
import type { CreateTaskResult, NoteRef, ProjectDetail, ResourceRef } from "../../interfaces/projects.interfaces";
import { ProjectFormModal, type ProjectPayload } from "../../components/projects/ProjectFormModal";
import { ProjectTaskModal, type ProjectTaskPayload } from "../../components/projects/ProjectTaskModal";
import { todayISO } from "../../utils/datesUtils";
import { ScreenSpinner } from "../../components/ScreenSpinnerProps";
import Circles from "../../components/Circles";
import { DockMenu } from "../../components/DockMenu";
import { ProjectHeader } from "../../components/projects/ProjectHeader";
import { SummaryTab } from "../../components/projects/SummaryTab";
import { TasksTab } from "../../components/projects/TasksTab";
import { NotesTab } from "../../components/projects/NotesTab";
import { ResourcesTab } from "../../components/projects/ResourcesTab";
import { getMenuItems } from "../../utils/globalUtils";


type TabKey = "summary" | "tasks" | "notes" | "resources";

const ProjectView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { requestAuth } = useApi();
    const [params, setParams] = useSearchParams();
    // notes are not needed here: editing only touches the project's own notes
    const { skills, resources, createSkill, createResource } = useProjectOptions({ notes: false });

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const bump = useCallback(() => setReloadKey((k) => k + 1), []);

    const [editOpen, setEditOpen] = useState(false);
    const [projectNotes, setProjectNotes] = useState<NoteRef[]>([]);
    const [projectResources, setProjectResources] = useState<ResourceRef[]>([]);
    const [taskOpen, setTaskOpen] = useState(false);
    const [notice, setNotice] = useState("");

    const raw = params.get("tab");
    const tab: TabKey =
        raw === "tasks" || raw === "notes" || raw === "resources" ? raw : "summary";
    const setTab = (t: TabKey) => setParams(t === "summary" ? {} : { tab: t }, { replace: true });

    useEffect(() => {
        const load = async () => {
            const data = await requestAuth<ProjectDetail>(`/api/projects/${id}`, { method: "GET" });
            setFirstLoad(false);
            if (data) setProject(data);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, reloadKey]);

    // the edit modal needs the project's notes and resources, so load them first
    const openEdit = async () => {
        const [n, r] = await Promise.all([
            requestAuth<NoteRef[]>(`/api/projects/${id}/notes`, { method: "GET" }),
            requestAuth<ResourceRef[]>(`/api/projects/${id}/resources`, { method: "GET" }),
        ]);
        setProjectNotes(n ?? []);
        setProjectResources(r ?? []);
        setEditOpen(true);
    };

    const handleSaveProject = async (payload: ProjectPayload): Promise<boolean> => {
        const data = await requestAuth(`/api/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        if (!data) return false; // keep the modal open so nothing is lost

        setEditOpen(false);
        bump();
        return true;
    };

    const handleCreateTask = async (payload: ProjectTaskPayload): Promise<boolean> => {
        const data = await requestAuth<CreateTaskResult>(`/api/projects/${id}/tasks`, {
            method: "POST",
            body: JSON.stringify({ ...payload, today: todayISO() }),
        });
        if (!data) return false;

        setTaskOpen(false);
        setNotice(
            payload.addToDaily && !data.dailyLinked
                ? "No list covers today, so the task was added only to the project."
                : "",
        );
        bump();
        return true;
    };

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: "summary", label: "Summary" },
        { key: "tasks", label: "Tasks", count: project?.tasks_count },
        { key: "notes", label: "Notes", count: project?.notes_count },
        { key: "resources", label: "Resources", count: project?.resources_count },
    ];

    return (
        <div className="h-auto">
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

                <DockMenu items={getMenuItems(navigate)} />

                {!project ? (
                    <p className="text-center text-[#A7B5AD]">Project not found</p>
                ) : (
                    <>
                        <ProjectHeader
                            project={project}
                            onBack={() => navigate("/projects")}
                            onNewTask={() => setTaskOpen(true)}
                            onEdit={openEdit}
                        />

                        {notice && (
                            <div className="glass flex items-center justify-between gap-3 px-4 py-3 text-sm text-amber-200">
                                <span>{notice}</span>
                                <button
                                    type="button"
                                    onClick={() => setNotice("")}
                                    aria-label="Dismiss"
                                    className="text-[#A7B5AD] transition hover:text-[#F2F2F2]"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <nav role="tablist" className="flex gap-1 overflow-x-auto border-b border-white/10">
                            {tabs.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`cursor-pointer -mb-px shrink-0 border-b-2 px-4 py-2 text-sm transition ${tab === t.key
                                            ? "border-[#8FD3AE] text-[#8FD3AE]"
                                            : "border-transparent text-[#A7B5AD] hover:text-[#F2F2F2] cursor-pointer"
                                        }`}
                                >
                                    {t.label}
                                    {t.count !== undefined && <span className="num ml-1.5 text-xs opacity-70">{t.count}</span>}
                                </button>
                            ))}
                        </nav>

                        {tab === "summary" && (
                            <SummaryTab projectId={id!} reloadKey={reloadKey} onChanged={bump} onGoTab={setTab} />
                        )}
                        {tab === "tasks" && <TasksTab projectId={id!} reloadKey={reloadKey} onChanged={bump} />}
                        {tab === "notes" && (
                            <NotesTab
                                projectId={id!}
                                reloadKey={reloadKey}
                                onChanged={bump}
                                skills={skills}
                                resources={resources}
                            />
                        )}
                        {tab === "resources" && (
                            <ResourcesTab projectId={id!} reloadKey={reloadKey} onChanged={bump} skills={skills} />
                        )}
                    </>
                )}
            </main>

            <ProjectFormModal
                open={editOpen}
                project={project}
                projectNotes={projectNotes}
                projectResources={projectResources}
                skills={skills}
                notes={[]}
                resources={resources}
                onCreateSkill={createSkill}
                onCreateResource={createResource}
                onClose={() => setEditOpen(false)}
                onSubmit={handleSaveProject}
            />

            <ProjectTaskModal open={taskOpen} onClose={() => setTaskOpen(false)} onSubmit={handleCreateTask} />
        </div>
    );
};

export default ProjectView;