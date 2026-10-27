import { typeLabel } from "../../interfaces/resources.interfaces";
import type { ResourceRef } from "../../interfaces/projects.interfaces";

function domainOf(link: string) {
    try {
        return new URL(link).hostname.replace(/^www\./, "");
    } catch {
        return link;
    }
}

export function ResourceMini({ resource: r }: { resource: ResourceRef }) {
    return (
        <li>
            <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="glass flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:-translate-y-0.5"
            >
                <span className="shrink-0 rounded-md border border-[#8FD3AE]/30 bg-[#8FD3AE]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#8FD3AE]">
                    {typeLabel(r.type)}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[#F2F2F2]">{r.name}</span>
                    <span className="block truncate text-xs text-[#A7B5AD]">{domainOf(r.link)}</span>
                </span>
            </a>
        </li>
    );
}