const IconBase = ({ 
    size = 20, 
    children,
    className
}: { 
    size?: number; 
    children: React.ReactNode;
    className?: string;
}) => (
    <svg
        className={`${className} hover:bg-[#34463D]/90 rounded-xl `}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);
export default IconBase;