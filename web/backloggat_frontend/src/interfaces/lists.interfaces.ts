export type TaskStatus = "TO_DO" | "DOING" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type ListInfo = {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    days_count: number;
    tasks_count: number;
    done_count: number;
    created_at: string;
    updated_at: string;
};

export type DayInfo = {
    id: number;
    list_id: number;
    title: string;
    note: string;
    task_date: string;
    position: number;
    tasks_count: number;
    done_count: number;
};

export type TaskInfo = {
    id: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    start_date: string;
    end_date: string;
    day_id: number | null;
    project_id: number | null;
};

export type ListDetail = ListInfo & { days: DayInfo[] };
export type DayDetail = DayInfo & { tasks: TaskInfo[] };