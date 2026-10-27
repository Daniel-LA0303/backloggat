export function ProgressBar({ done, total }: { done: number; total: number }) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
        <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-[#8FD3AE] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="num mt-1 text-[11px] text-[#A7B5AD]">
                {done}/{total} done {total > 0 && `· ${pct}%`}
            </p>
        </div>
    );
}