export const RESOURCE_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "docs", label: "Docs" },
  { value: "repo", label: "Repo" },
  { value: "course", label: "Course" },
  { value: "other", label: "Other" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

export const typeLabel = (t: string) =>
  RESOURCE_TYPES.find((x) => x.value === t)?.label ?? t;

export type ResourceInfo = {
  id: number;
  name: string;
  link: string;
  type: ResourceType;
  skills_count: number;
  notes_count: number;
  projects_count: number;
  created_at: string;
  updated_at: string;
};

export type ResourceDetail = ResourceInfo & {
  skills: { id: number; name: string; color: string }[];
  noteIds: number[];
  projectIds: number[];
};