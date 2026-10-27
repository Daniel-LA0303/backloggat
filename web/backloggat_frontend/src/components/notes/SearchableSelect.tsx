import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableOption = { value: string; label: string; color?: string };

type Props = {
  options: SearchableOption[];
  value: string; // "" = nothing selected
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string; // first row that clears the selection
  className?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  allLabel = "All",
  className = "w-full",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    inputRef.current?.focus();

    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const rowClass = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#96bea8]/15 ${
      active ? "text-[#b9e2cb]" : "text-white/75"
    }`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-4 text-left text-sm text-white backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96bea8]/20 ${
          open
            ? "border-[#96bea8]/60 bg-[#0a100d]/75"
            : "border-[#96bea8]/25 bg-[#121c17]/55 hover:border-[#96bea8]/40"
        }`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected ? "" : "text-white/35"}`}>
          {selected?.color && (
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
          )}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>

        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-[#9fd0b4] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-[#96bea8]/25 bg-[#0e1612]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl glass-scroll">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[0]) choose(filtered[0].value);
              }
            }}
            placeholder="Type to search..."
            className="mb-1.5 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#96bea8]/50"
          />

          <ul role="listbox" className="max-h-60 overflow-auto">
            {!query && (
              <li>
                <button type="button" onClick={() => choose("")} className={rowClass(value === "")}>
                  {allLabel}
                </button>
              </li>
            )}

            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => choose(o.value)}
                  className={rowClass(o.value === value)}
                >
                  {o.color && (
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                  )}
                  <span className="truncate">{o.label}</span>
                </button>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-white/40">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}