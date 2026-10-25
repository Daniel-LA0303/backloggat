

type SpinnerProps = {
  size?: number;        // px, default 16
  label?: string;       // screen reader text
  className?: string;
};

export function Spinner({ size = 16, label = "Loading", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`spinner ${className}`}
      style={{ "--size": `${size}px` } as React.CSSProperties}
    />
  );
}