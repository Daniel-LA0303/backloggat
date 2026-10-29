import { useEffect, useState } from "react";
import { useApi } from "../../context/ApiContext";
import { ResourceFormModal, type ResourcePayload } from "../resources/ResourceFormModal";
import { ResourceMini } from "./ResourceMini";
import type { SkillInfo } from "../../interfaces/skills.interfaces";
import type { ResourceRef } from "../../interfaces/projects.interfaces";
import { toFormData } from "../../utils/globalUtils";

type Props = {
    projectId: string;
    reloadKey: number;
    onChanged: () => void;
    skills: SkillInfo[];
};

export function ResourcesTab({ projectId, reloadKey, onChanged, skills }: Props) {
    const { requestAuth } = useApi();

    const [items, setItems] = useState<ResourceRef[]>([]);
    const [formOpen, setFormOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            const data = await requestAuth<ResourceRef[]>(`/api/projects/${projectId}/resources`, {
                method: "GET",
            });
            if (data) setItems(data);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, reloadKey]);

    const handleSave = async (payload: ResourcePayload): Promise<boolean> => {
        const data = await requestAuth("/api/resources", {
            method: "POST",
            body: toFormData(payload)
        });
        if (!data) return false;

        setFormOpen(false);
        onChanged();
        return true;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="cursor-pointer rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20"
                >
                    New resource
                </button>
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-[#A7B5AD]">No resources linked to this project</p>
            ) : (
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {items.map((r) => (
                        <ResourceMini key={r.id} resource={r} />
                    ))}
                </ul>
            )}

            <ResourceFormModal
                open={formOpen}
                skills={skills}
                extra={{ projectId: Number(projectId) }}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
            />
        </div>
    );
}