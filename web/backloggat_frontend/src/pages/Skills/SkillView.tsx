import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import { useApi } from "../../context/ApiContext";
import type { ResourceInfo } from "../../interfaces/resources.interfaces";
import { ScreenSpinner } from "../../components/ScreenSpinnerProps";
import Circles from "../../components/Circles";
import { DockMenu } from "../../components/DockMenu";
import { GearIcon } from "../../utils/iconsUtils";
import { SkillListTab } from "../../components/skills/SkillListTab";
import type { KnowledgeInfo } from "../../interfaces/knowledge.interfaces";
import { KnowledgeCard } from "../../components/knowledge/KnowledgeCard";
import type { NoteInfo } from "../../interfaces/notes.interfaces";
import { NoteCard } from "../../components/notes/NoteCard";
import { ResourceRow } from "../../components/resources/ResourceRow";
import type { ProjectInfo } from "../../interfaces/projects.interfaces";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { KnowledgeFormModal, type KnowledgePayload } from "../../components/knowledge/KnowledgeFormModal";
import { NoteFormModal, type NotePayload } from "../../components/notes/NoteFormModal";
import { ResourceFormModal, type ResourcePayload } from "../../components/resources/ResourceFormModal";


type TabKey = "knowledge" | "notes" | "resources" | "projects";
type ModalKey = "knowledge" | "note" | "resource" | null;

const KNOWLEDGE_SORT = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
] as const;

const NOTES_SORT = [
  { value: "updated_at", label: "Updated" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Title" },
] as const;

const RESOURCES_SORT = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
  { value: "type", label: "Type" },
] as const;

const PROJECTS_SORT = [
  { value: "updated_at", label: "Updated" },
  { value: "created_at", label: "Created" },
  { value: "title", label: "Title" },
  { value: "start_date", label: "Start date" },
  { value: "progress", label: "Progress" },
] as const;

const SkillView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { requestAuth } = useApi();
  const [params, setParams] = useSearchParams();

  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [resources, setResources] = useState<ResourceInfo[]>([]); // options for the note modal
  const [firstLoad, setFirstLoad] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const bump = useCallback(() => setReloadKey((k) => k + 1), []);
  const [modal, setModal] = useState<ModalKey>(null);

  const raw = params.get("tab");
  const tab: TabKey =
    raw === "notes" || raw === "resources" || raw === "projects" ? raw : "knowledge";
  const setTab = (t: TabKey) => setParams(t === "knowledge" ? {} : { tab: t }, { replace: true });

  // header + counters come from the list, and refresh after every create
  useEffect(() => {
    const load = async () => {
      const [s, r] = await Promise.all([
        requestAuth<SkillInfo[]>("/api/skills", { method: "GET" }),
        requestAuth<ResourceInfo[]>("/api/resources", { method: "GET" }),
      ]);
      setFirstLoad(false);
      if (s) setSkills(s);
      if (r) setResources(r);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const skill = skills.find((s) => String(s.id) === id) ?? null;

  // MUST be stable: the modals reset their form when this changes
  const defaultSkillIds = useMemo(() => [Number(id)], [id]);

  const create = (url: string) => async (payload: unknown): Promise<boolean> => {
    const data = await requestAuth(url, { method: "POST", body: JSON.stringify(payload) });
    if (!data) return false; // keep the modal open so nothing is lost
    setModal(null);
    bump();
    return true;
  };

  if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "knowledge", label: "Knowledge", count: skill?.countKnowledges },
    { key: "notes", label: "Notes", count: skill?.countNotes },
    { key: "resources", label: "Resources", count: skill?.countResources },
    { key: "projects", label: "Projects", count: skill?.countProject },
  ];

  return (
    <>
      <div className="page-bg">
        <Circles />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
        <DockMenu
          items={[
            { label: "Home", onClick: () => navigate("/") },
            { label: "Skills", onClick: () => navigate("/skills") },
            { label: "Settings", icon: <GearIcon size={16} />, onClick: () => navigate("/profile") },
          ]}
        />

        {!skill ? (
          <p className="text-center text-[#A7B5AD]">Skill not found</p>
        ) : (
          <>
            <header className="glass relative overflow-hidden p-5">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full opacity-25 blur-3xl"
                style={{ backgroundColor: skill.color }}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => navigate("/skills")}
                  className="mb-1 text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2]"
                >
                  ← All skills
                </button>
                <div className="flex items-center gap-3">
                  <span
                    className="size-3.5 shrink-0 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: skill.color, boxShadow: `0 0 14px ${skill.color}99` }}
                  />
                  <h1 className="truncate text-2xl sm:text-3xl">{skill.name}</h1>
                </div>
              </div>
            </header>

            <nav role="tablist" className="flex gap-1 overflow-x-auto border-b border-white/10">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm transition ${
                    tab === t.key
                      ? "border-[#8FD3AE] text-[#8FD3AE]"
                      : "border-transparent text-[#A7B5AD] hover:text-[#F2F2F2]"
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="num ml-1.5 text-xs opacity-70">{t.count}</span>
                  )}
                </button>
              ))}
            </nav>

            {tab === "knowledge" && (
              <SkillListTab<KnowledgeInfo, "name" | "created_at">
                path="/api/knowledges"
                skillId={id!}
                reloadKey={reloadKey}
                sortOptions={[...KNOWLEDGE_SORT]}
                defaultFilters={{ search: "", sortBy: "name", order: "asc" }}
                searchPlaceholder="Search knowledge..."
                emptyText="No knowledge for this skill yet"
                emptyFilteredText="No knowledge matches your search"
                action={{ label: "+ New knowledge", onClick: () => setModal("knowledge") }}
                renderItem={(k, i) => <KnowledgeCard knowledge={k} index={i} />}
              />
            )}

            {tab === "notes" && (
              <SkillListTab<NoteInfo, "updated_at" | "created_at" | "title">
                path="/api/notes"
                skillId={id!}
                reloadKey={reloadKey}
                sortOptions={[...NOTES_SORT]}
                defaultFilters={{ search: "", sortBy: "updated_at", order: "desc" }}
                searchPlaceholder="Search notes..."
                emptyText="No notes for this skill yet"
                emptyFilteredText="No notes match your search"
                action={{ label: "+ New note", onClick: () => setModal("note") }}
                renderItem={(n, i) => <NoteCard note={n} index={i} />}
              />
            )}

            {tab === "resources" && (
              <SkillListTab<ResourceInfo, "name" | "created_at" | "type">
                path="/api/resources"
                skillId={id!}
                reloadKey={reloadKey}
                layout="list"
                sortOptions={[...RESOURCES_SORT]}
                defaultFilters={{ search: "", sortBy: "name", order: "asc" }}
                searchPlaceholder="Search by name or link..."
                emptyText="No resources for this skill yet"
                emptyFilteredText="No resources match your search"
                action={{ label: "+ New resource", onClick: () => setModal("resource") }}
                renderItem={(r, i) => <ResourceRow item={r} index={i} />}
              />
            )}

            {tab === "projects" && (
              <SkillListTab<ProjectInfo, "updated_at" | "created_at" | "title" | "start_date" | "progress">
                path="/api/projects"
                skillId={id!}
                reloadKey={reloadKey}
                sortOptions={[...PROJECTS_SORT]}
                defaultFilters={{ search: "", sortBy: "updated_at", order: "desc" }}
                searchPlaceholder="Search projects..."
                emptyText="No projects use this skill yet"
                emptyFilteredText="No projects match your search"
                action={{ label: "Go to projects to create one →", onClick: () => navigate("/projects") }}
                renderItem={(p, i) => (
                  <ProjectCard project={p} index={i} onClick={(x) => navigate(`/projects/${x.id}`)} />
                )}
              />
            )}
          </>
        )}
      </main>

      <KnowledgeFormModal
        open={modal === "knowledge"}
        skills={skills}
        defaultSkillIds={defaultSkillIds}
        onClose={() => setModal(null)}
        onSubmit={(p: KnowledgePayload) => create("/api/knowledges")(p)}
      />

      <NoteFormModal
        open={modal === "note"}
        skills={skills}
        resources={resources}
        defaultSkillIds={defaultSkillIds}
        onClose={() => setModal(null)}
        onSubmit={(p: NotePayload) => create("/api/notes")(p)}
      />

      <ResourceFormModal
        open={modal === "resource"}
        skills={skills}
        defaultSkillIds={defaultSkillIds}
        onClose={() => setModal(null)}
        onSubmit={(p: ResourcePayload) => create("/api/resources")(p)}
      />
    </>
  );
};

export default SkillView;