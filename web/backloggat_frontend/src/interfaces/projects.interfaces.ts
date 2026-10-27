import type { TaskInfo } from "./lists.interfaces";

export type ProjectStatus = "ACTIVE" | "DONE";

export type ProjectInfo = {
  id: number;
  title: string;
  description: string; // HTML from the rich text editor
  start_date: string;
  end_date: string;    // "" when there is none
  status: ProjectStatus;
  progress: number;    // 0-100
  tasks_count: number;
  done_count: number;
  notes_count: number;
  resources_count: number;
  skills_count: number;
  created_at: string;
  updated_at: string;
};

export type ProjectDetail = ProjectInfo & {
  skills: { id: number; name: string; color: string }[];
};

export type NoteRef = {
  id: number;
  title: string;
  color: string;
  description: string;
  pinned: boolean;
  updated_at: string;
};

export type ResourceRef = {
  id: number;
  name: string;
  link: string;
  type: string;
};

export type ActivityInfo = {
  id: number;
  action: string;
  created_at: string;
};

export type ProjectSummary = {
  pinnedNotes: NoteRef[];
  recentTasks: TaskInfo[];
  resources: ResourceRef[];
  activity: ActivityInfo[];
};

export type CreateTaskResult = TaskInfo & { dailyLinked: boolean };