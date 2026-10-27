import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import { DockMenu } from "../components/DockMenu";
import Circles from "../components/Circles";
import Modal from "../components/Modal";
import { ListCard } from "../components/lists/ListCard";
import { ListFormModal, type ListPayload } from "../components/lists/ListFormModal";
import type { ListInfo } from "../interfaces/lists.interfaces";
import { getMenuItems } from "../utils/globalUtils";
import UIButton from "../components/UIButton";
import { PlusIcon } from "../utils/iconsUtils";

const Lists = () => {
    const navigate = useNavigate();
    const { requestAuth } = useApi();

    const [items, setItems] = useState<ListInfo[]>([]);
    const [firstLoad, setFirstLoad] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ListInfo | null>(null);
    const [toDelete, setToDelete] = useState<ListInfo | null>(null);

    const fetchItems = useCallback(async () => {
        const data = await requestAuth<ListInfo[]>("/api/lists", { method: "GET" });
        setFirstLoad(false);
        if (data) setItems(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (l: ListInfo) => {
        setEditing(l);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
    };

    const handleSave = async (payload: ListPayload): Promise<boolean> => {
        const url = editing ? `/api/lists/${editing.id}` : "/api/lists";
        const data = await requestAuth<ListInfo>(url, {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(payload),
        });
        if (!data) return false;

        closeForm();
        await fetchItems(); // refresh counters
        return true;
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        await requestAuth(`/api/lists/${toDelete.id}`, { method: "DELETE" });
        setToDelete(null);
        await fetchItems();
    };

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    return (
        <>
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

                <DockMenu items={getMenuItems(navigate)} />

                <div className="flex items-center justify-between gap-3">
                    <p className="text-3xl">Your lists</p>
                    <UIButton
                        type="button"
                        onClick={openCreate}
                        size="medium"
                        leftIcon={<PlusIcon size={16} />}
                    >
                        New list
                    </UIButton>
                </div>

                {items.length === 0 && (
                    <p className="text-center text-[#A7B5AD]">No lists yet, create one</p>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((l, index) => (
                        <ListCard
                            key={l.id}
                            list={l}
                            index={index}
                            onClick={(x) => navigate(`/lists/${x.id}`)}
                            onEdit={openEdit}
                            onDelete={setToDelete}
                        />
                    ))}
                </div>
            </main>

            <ListFormModal open={formOpen} list={editing} onClose={closeForm} onSubmit={handleSave} />

            <Modal
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                className="w-full md:max-w-sm"
                title="Delete list"
            >
                <div className="p-3">
                    <p className="text-sm text-[#A7B5AD]">
                        Delete <span className="text-[#F2F2F2]">{toDelete?.title}</span> with all its days and
                        tasks? Tasks that also belong to a project are kept there.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setToDelete(null)}
                            className="rounded-lg px-4 py-2 text-sm text-[#A7B5AD] transition hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Lists;