

const Circles = () => {
    return (
        <div>
            <div className="" aria-hidden="true">
                <div className="grain"></div>
                <div className="rail"></div>

                <svg className="rings rings-a" viewBox="0 0 600 600" fill="none" stroke="#8FD3AE">
                    <circle cx="300" cy="300" r="292" stroke-width="1" />
                    <circle cx="300" cy="300" r="268" stroke-width="22" pathLength="360" stroke-dasharray="0.8 29.2" stroke-opacity="0.8" />
                    <circle className="spin-a" cx="300" cy="300" r="272" stroke-width="12" pathLength="360" stroke-dasharray="0.5 4.5" />
                    <circle className="spin-b" cx="300" cy="300" r="236" stroke-width="1" stroke-dasharray="6 10" />
                    <circle cx="300" cy="300" r="196" stroke-width="1" />
                    <circle className="spin-a" cx="300" cy="300" r="158" stroke-width="3" pathLength="360" stroke-dasharray="70 290" />
                    <circle className="spin-b" cx="300" cy="300" r="146" stroke-width="1.5" pathLength="360" stroke-dasharray="26 334" />
                    <circle cx="300" cy="300" r="112" stroke-width="1" />
                    <circle cx="300" cy="300" r="6" stroke-width="1" />
                    <path d="M300 0V600M0 300H600" stroke-width="0.5" />
                    <g stroke="none" fill="#8FD3AE" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.5" text-anchor="middle">
                        <text x="300" y="24">000</text>
                        <text x="300" y="584">180</text>
                        <text x="578" y="304" text-anchor="end">090</text>
                        <text x="22" y="304" text-anchor="start">270</text>
                    </g>
                </svg>
                <svg className="rings rings-b" viewBox="0 0 600 600" fill="none" stroke="#8FD3AE">
                    <circle cx="300" cy="300" r="292" stroke-width="1" />
                    <circle className="spin-b" cx="300" cy="300" r="268" stroke-width="12" pathLength="360" stroke-dasharray="0.5 4.5" />
                    <circle className="spin-d" cx="300" cy="300" r="228" stroke-width="1" stroke-dasharray="4 12" />
                    <circle cx="300" cy="300" r="180" stroke-width="1" />
                    <circle className="spin-a" cx="300" cy="300" r="140" stroke-width="3" pathLength="360" stroke-dasharray="50 310" />
                    <circle cx="300" cy="300" r="90" stroke-width="1" />
                    <path d="M300 0V600M0 300H600" stroke-width="0.5" />
                </svg>
            </div>
        </div>
    )
}

export default Circles