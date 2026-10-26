export type NoteInfo = {
  id: number;
  title: string;
  color: string;
  description: string;
  pinned: boolean;
  skills_count: number;
  resources_count: number;
  projects_count: number;
  created_at: string;
  updated_at: string;
};

export type NoteDetail = NoteInfo & {
  content: string; // HTML from the rich text editor
  skills: { id: number; name: string; color: string }[];
  resources: { id: number; name: string; type: string }[];
  projectIds: number[];
};