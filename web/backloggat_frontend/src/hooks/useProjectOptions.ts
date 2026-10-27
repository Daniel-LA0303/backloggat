import { useCallback, useEffect, useState } from "react";
import { useApi } from "../context/ApiContext";
import type { SkillInfo } from "../interfaces/skills.interfaces";
import type { NoteInfo } from "../interfaces/notes.interfaces";
import type { ResourceInfo, ResourceType } from "../interfaces/resources.interfaces";

export function useProjectOptions(opts: { notes?: boolean } = {}) {
    const { notes: withNotes = true } = opts;
    const { requestAuth } = useApi();

    const [skills, setSkills] = useState<SkillInfo[]>([]);
    const [notes, setNotes] = useState<NoteInfo[]>([]);
    const [resources, setResources] = useState<ResourceInfo[]>([]);

    useEffect(() => {
        const load = async () => {
            const [s, r, n] = await Promise.all([
                requestAuth<SkillInfo[]>("/api/skills", { method: "GET" }),
                requestAuth<ResourceInfo[]>("/api/resources", { method: "GET" }),
                withNotes ? requestAuth<NoteInfo[]>("/api/notes", { method: "GET" }) : Promise.resolve(null),
            ]);
            if (s) setSkills(s);
            if (r) setResources(r);
            if (n) setNotes(n);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createSkill = useCallback(async (name: string): Promise<SkillInfo | null> => {
        const data = await requestAuth<SkillInfo>("/api/skills", {
            method: "POST",
            body: JSON.stringify({ name, color: "#64748b" }),
        });
        if (!data) return null;
        setSkills((prev) => [...prev, data]);
        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // created without projectId: it gets linked when the project is saved
    const createResource = useCallback(
        async (p: { name: string; link: string; type: ResourceType }): Promise<ResourceInfo | null> => {
            const data = await requestAuth<ResourceInfo>("/api/resources", {
                method: "POST",
                body: JSON.stringify({ ...p, skillsIds: [] }),
            });
            if (!data) return null;
            setResources((prev) => [...prev, data]);
            return data;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    return { skills, notes, resources, createSkill, createResource };
}