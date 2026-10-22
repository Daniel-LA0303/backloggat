import { useState, type ReactNode } from 'react';

type DockItem = {
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
};

export function DockMenu({ items }: { items: DockItem[] }) {
    const [open, setOpen] = useState(false);

    return (
        // full-width fixed row, never blocks clicks on the page
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center">
            <nav
                aria-label="Quick menu"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
                }}
                className="
                    pointer-events-auto flex items-center rounded-2xl p-1.5
                    border border-[#96bea8]/25
                    bg-[#121c17]/60 backdrop-blur-xl backdrop-saturate-150
                    shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]
                "
            >
                {/* handle: always visible, also the tap target on mobile */}
                <button
                    type="button"
                    aria-expanded={open}
                    aria-label="Toggle menu"
                    onClick={() => setOpen((o) => !o)}
                    className="
                        grid h-10 w-10 shrink-0 place-items-center rounded-xl
                        text-[#9fd0b4] transition-colors duration-200
                        hover:bg-[#96bea8]/15 hover:text-white
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96bea8]/40
                    "
                >
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                    >
                        <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
                    </svg>
                </button>

                {/* options: the column grows from 0 to its content width */}
                <div
                    className={`
                        grid transition-[grid-template-columns,opacity] duration-300 ease-out
                        ${open ? 'grid-cols-[1fr] opacity-100' : 'pointer-events-none grid-cols-[0fr] opacity-0'}
                    `}
                >
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                        {items.map((item, i) => (
                            <button
                                key={item.label}
                                type="button"
                                tabIndex={open ? 0 : -1}
                                onClick={item.onClick}
                                style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
                                className={`
                                    flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5
                                    text-[13px] text-white/75
                                    transition-[opacity,transform,background-color,color] duration-300
                                    hover:bg-[#96bea8]/15 hover:text-white
                                    active:translate-y-px
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96bea8]/40
                                    ${i === 0 ? 'ml-1.5' : ''}
                                    ${open ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
        </div>
    );
}