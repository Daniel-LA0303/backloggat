// SkillCard.tsx

import type { SkillInfo } from "../../interfaces/skills.interfaces";

type SkillCardProps = {
  skill: SkillInfo;
  index?: number;               // for the staggered "rise" animation
  onClick?: (skill: SkillInfo) => void;
  onDelete?: (skill: SkillInfo) => void;
};

// SQLite datetime('now') is UTC without a timezone, so mark it as UTC before parsing
function formatDate(value: string) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function SkillCard({ skill, index = 0, onClick, onDelete }: SkillCardProps) {
  const stats = [
    { label: "Projects", value: skill.countProject },
    { label: "Notes", value: skill.countNotes },
    { label: "Resources", value: skill.countResources },
    { label: "Knowledge", value: skill.countKnowledges },
  ];

  const total = stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <article
      onClick={() => onClick?.(skill)}
      style={{ "--i": index } as React.CSSProperties}
      className="glass corners rise group relative cursor-pointer overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* soft glow in the skill color, top left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 size-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: skill.color }}
      />

      {/* header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="size-3 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: skill.color, boxShadow: `0 0 14px ${skill.color}99` }}
          />
          <h3 className="truncate text-lg font-semibold tracking-tight text-[#F2F2F2]">
            {skill.name}
          </h3>
        </div>

        <span
          className={`num shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${
            total > 0
              ? "border-[#8FD3AE]/40 bg-[#8FD3AE]/10 text-[#8FD3AE]"
              : "border-white/10 bg-white/5 text-[#A7B5AD]"
          }`}
        >
          {total > 0 ? `${total} linked` : "Unused"}
        </span>
      </div>

      {/* divider */}
      <div className="relative my-4 h-px w-full bg-gradient-to-r from-[#8FD3AE]/40 via-[#96BEA8]/15 to-transparent" />

      {/* stats */}
      <dl className="relative grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-lg border border-white/5 bg-black/20 px-1 py-2.5"
          >
            <dd
              className={`num text-xl font-semibold ${
                s.value > 0 ? "text-[#F2F2F2]" : "text-[#A7B5AD]/50"
              }`}
            >
              {s.value}
            </dd>
            <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-[#A7B5AD]">
              {s.label}
            </dt>
          </div>
        ))}
      </dl>

      {/* footer */}
      <div className="relative mt-4 flex items-center justify-between text-xs text-[#A7B5AD]">
        <span>Created {formatDate(skill.created_at)}</span>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // don't trigger the card's onClick
              onDelete(skill);
            }}
            className="rounded-md px-2 py-1 text-[#A7B5AD] opacity-0 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}