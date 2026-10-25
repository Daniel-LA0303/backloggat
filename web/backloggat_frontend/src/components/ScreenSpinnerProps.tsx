export function ScreenSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[#111815]/70 backdrop-blur-md"
    >
      <div className="glass corners flex flex-col items-center gap-5 px-10 py-8">
        <div className="relative size-28 drop-shadow-[0_0_10px_rgba(143,211,174,0.35)]">
          {/* static track + corner brackets */}
          <svg viewBox="0 0 120 120" fill="none" className="absolute inset-0 size-full">
            <circle cx="60" cy="60" r="44" stroke="rgba(150,190,168,0.2)" strokeWidth="3" />
            <g stroke="rgba(143,211,174,0.75)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 16V4h12" />
              <path d="M104 4h12v12" />
              <path d="M4 104v12h12" />
              <path d="M116 104v12h-12" />
            </g>
          </svg>

          {/* outer arc, clockwise */}
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 size-full animate-[spin_1.2s_linear_infinite]"
          >
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="#8FD3AE"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="70 207"
            />
          </svg>

          {/* inner dotted ring, counter-clockwise */}
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 size-full animate-[spin_2.4s_linear_infinite_reverse]"
          >
            <circle
              cx="60"
              cy="60"
              r="30"
              stroke="rgba(190,225,205,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="1 9"
            />
          </svg>

          {/* center dot */}
          <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#8FD3AE]" />
        </div>

        <p className="text-sm text-[#A7B5AD]">{text}</p>
      </div>
    </div>
  );
}