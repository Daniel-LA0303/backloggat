


import type { NavigateFunction } from "react-router-dom";
import {KnowledgeIcon, MonthIcon, NotesIcon, PasswordsIcon, ProjectsIcon, ResourcesIcon, SkillsIcon } from "./iconsUtils";

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
    label: "Passwords",
    icon: <PasswordsIcon size={16} />,
    onClick: () => navigate("/passwords"),
  },
  {
    label: "Resources",
    icon: <ResourcesIcon size={16} />,
    onClick: () => navigate("/resources"),
  },
  {
    label: "Notes",
    icon: <NotesIcon size={16} />,
    onClick: () => navigate("/notes"),
  },
];