import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import type { DayDetail, DayInfo, ListDetail, TaskInfo, TaskPriority } from "../../interfaces/lists.interfaces";
import { TaskEditModal, type TaskPayload } from "../../components/lists/TaskEditModal";
import { ScreenSpinner } from "../../components/ScreenSpinnerProps";
import Circles from "../../components/Circles";
import { DockMenu } from "../../components/DockMenu";
import { formatLong } from "../../utils/datesUtils";
import { QuickAddTask } from "../../components/lists/QuickAddTask";
import { TaskItem } from "../../components/lists/TaskItem";
import Modal from "../../components/Modal";
import { DayNote } from "../../components/lists/DayNote";
import { getMenuItems } from "../../utils/globalUtils";
import { ArrowLeftIcon, DeleteIcon } from "../../utils/iconsUtils";



const DayView = () => {
    const navigate = useNavigate();
    const { id: listId, dayId } = useParams();
    const { requestAuth } = useApi();

    const [day, setDay] = useState<DayDetail | null>(null);
    const [days, setDays] = useState<DayInfo[]>([]); // only to know prev/next
    const [firstLoad, setFirstLoad] = useState(true);
    const [showDone, setShowDone] = useState(false);

    //const [note, setNote] = useState("");
    //const [savingNote, setSavingNote] = useState(false);


    const [editing, setEditing] = useState<TaskInfo | null>(null);
    const [toDelete, setToDelete] = useState<TaskInfo | null>(null);

    const fetchDay = useCallback(async () => {
        const data = await requestAuth<DayDetail>(`/api/days/${dayId}`, { method: "GET" });
        setFirstLoad(false);
        if (data) {
            setDay(data);
            //setNote(data.note);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayId]);

    useEffect(() => {
        fetchDay();
    }, [fetchDay]);

    // the list is loaded once, just for the arrows
    useEffect(() => {
        const loadDays = async () => {
            const data = await requestAuth<ListDetail>(`/api/lists/${listId}`, { method: "GET" });
            if (data) setDays(data.days);
        };
        loadDays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId]);

    const { prev, next } = useMemo(() => {
        const i = days.findIndex((d) => String(d.id) === dayId);
        return { prev: i > 0 ? days[i - 1] : null, next: i >= 0 && i < days.length - 1 ? days[i + 1] : null };
    }, [days, dayId]);

    const goTo = (d: DayInfo | null) => d && navigate(`/lists/${listId}/days/${d.id}`);

    // ---- actions ----

    const handleAdd = async (title: string, priority: TaskPriority): Promise<boolean> => {
        const data = await requestAuth<TaskInfo>(`/api/days/${dayId}/tasks`, {
            method: "POST",
            body: JSON.stringify({ title, priority }),
        });
        if (!data) return false;
        await fetchDay();
        return true;
    };

    // optimistic: change the UI first, confirm with the backend after
    const handleToggle = async (t: TaskInfo) => {
        const status = t.status === "DONE" ? "TO_DO" : "DONE";

        setDay((d) =>
            d ? { ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, status } : x)) } : d,
        );

        const res = await requestAuth<TaskInfo>(`/api/tasks/${t.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        if (!res) await fetchDay(); // failed: go back to the real state
    };

    const handleEditSave = async (id: number, payload: TaskPayload): Promise<boolean> => {
        const data = await requestAuth<TaskInfo>(`/api/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        if (!data) return false;
        setEditing(null);
        await fetchDay();
        return true;
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        await requestAuth(`/api/tasks/${toDelete.id}`, { method: "DELETE" });
        setToDelete(null);
        await fetchDay();
    };

    const handleSaveNote = async (html: string): Promise<boolean> => {
        if (!day) return false;
        const data = await requestAuth<DayInfo>(`/api/days/${day.id}`, {
            method: "PUT",
            body: JSON.stringify({ title: day.title, note: html }),
        });
        if (!data) return false; // stay in edit mode so nothing is lost
        await fetchDay();
        return true;
    };

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    const pending = day?.tasks.filter((t) => t.status !== "DONE") ?? [];
    const done = day?.tasks.filter((t) => t.status === "DONE") ?? [];
    //const noteChanged = note.trim() !== (day?.note ?? "");

    const arrow = (enabled: boolean) =>
        `grid size-10 place-items-center cursor-pointer rounded-lg border border-white/10 bg-black/20 text-[#F2F2F2] transition ${enabled ? "hover:border-[#8FD3AE]/50 hover:text-[#8FD3AE]" : "opacity-30"
        }`;

    return (
        <>
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 py-10">

                <DockMenu items={getMenuItems(navigate)} />

                {!day ? (
                    <p className="text-center text-[#A7B5AD]">Day not found</p>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/lists/${listId}`)}
                                    className="mb-1 cursor-pointer text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2] flex items-center"
                                >
                                    <ArrowLeftIcon />
                                    <span className="text-2xl ml-2">Back to month</span>
                                </button>
                                <p className="text-2xl capitalize sm:text-3xl">{formatLong(day.task_date)}</p>
                            </div>

                            <div className="flex shrink-0 gap-2">
                                <button type="button" aria-label="Previous day" disabled={!prev}
                                    onClick={() => goTo(prev)} className={arrow(!!prev)}>‹</button>
                                <button type="button" aria-label="Next day" disabled={!next}
                                    onClick={() => goTo(next)} className={arrow(!!next)}>›</button>
                            </div>
                        </div>

                        <QuickAddTask onAdd={handleAdd} />

                        {day.tasks.length === 0 && (
                            <p className="text-center text-[#A7B5AD]">Nothing planned for this day</p>
                        )}

                        {pending.length > 0 && (
                            <ul className="flex flex-col gap-2">
                                {pending.map((t) => (
                                    <TaskItem key={t.id} task={t} onToggle={handleToggle}
                                        onEdit={setEditing} onDelete={setToDelete} />
                                ))}
                            </ul>
                        )}

                        {done.length > 0 && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowDone((s) => !s)}
                                    aria-expanded={showDone}
                                    className="mb-2 text-sm text-[#A7B5AD] transition hover:text-[#F2F2F2]"
                                >
                                    {showDone ? "▾" : "▸"} Completed ({done.length})
                                </button>
                                {showDone && (
                                    <ul className="flex flex-col gap-2">
                                        {done.map((t) => (
                                            <TaskItem key={t.id} task={t} onToggle={handleToggle}
                                                onEdit={setEditing} onDelete={setToDelete} />
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <DayNote key={day.id} value={day.note} onSave={handleSaveNote} />
                    </>
                )}
            </main>

            <TaskEditModal task={editing} onClose={() => setEditing(null)} onSubmit={handleEditSave} />

            <Modal
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                className="w-full md:max-w-sm"
                title="Delete task"
            >
                <div className="p-3">
                    <p className="text-sm text-[#A7B5AD]">
                        {toDelete?.project_id ? (
                            <>
                                <span className="text-[#F2F2F2]">{toDelete.title}</span> also belongs to a project, so
                                it will only be removed from this day.
                            </>
                        ) : (
                            <>
                                Delete <span className="text-[#F2F2F2]">{toDelete?.title}</span>? This cannot be undone.
                            </>
                        )}
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
                            className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20 flex items-center cursor-pointer"
                        >
                            <DeleteIcon />
                            <span className="ml-2">{toDelete?.project_id ? "Remove" : "Delete"}</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DayView;