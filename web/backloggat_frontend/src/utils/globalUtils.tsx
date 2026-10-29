


import type { NavigateFunction } from "react-router-dom";
import { KnowledgeIcon, MonthIcon, NotesIcon, PasswordsIcon, ProjectsIcon, ResourcesIcon, SkillsIcon } from "./iconsUtils";
import type { ResourcePayload } from "../components/resources/ResourceFormModal";

export const getMenuItems = (navigate: NavigateFunction) => [
  {
    label: "Home",
    icon: <MonthIcon size={16} />,
    onClick: () => navigate("/")
  },
  {
    label: "Projects",
    icon: <ProjectsIcon size={16} />,
    onClick: () => navigate("/projects"),
  },
  {
    label: "Skills",
    icon: <SkillsIcon size={16} />,
    onClick: () => navigate("/skills"),
  },
  {
    label: "Knowledges",
    icon: < KnowledgeIcon size={16} />,
    onClick: () => navigate("/knowledges"),
  },
  {
    label: "Notes",
    icon: <NotesIcon size={16} />,
    onClick: () => navigate("/notes"),
  },
  {
    label: "Resources",
    icon: <ResourcesIcon size={16} />,
    onClick: () => navigate("/resources"),
  },
  {
    label: "Passwords",
    icon: <PasswordsIcon size={16} />,
    onClick: () => navigate("/passwords"),
  },
];

export function toFormData(p: ResourcePayload): FormData {
  const fd = new FormData();
  fd.append("name", p.name);
  fd.append("type", p.type);
  p.skillsIds.forEach((id) => fd.append("skillsIds", String(id)));
  p.removeNotesIds?.forEach((id) => fd.append("removeNotesIds", String(id)));
  p.removeProjectsIds?.forEach((id) => fd.append("removeProjectsIds", String(id)));
  if (p.noteId != null) fd.append("noteId", String(p.noteId));
  if (p.projectId != null) fd.append("projectId", String(p.projectId));

  if (p.file) fd.append("file", p.file);   // el back sube a Drive y genera el link
  else fd.append("link", p.link);          // link directo

  return fd;
}