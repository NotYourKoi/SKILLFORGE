export default function ProgressBar({
  value,
  tone = "bg-complete",
  label,
  className = "",
}: {
  value: number;
  tone?: string;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-4 w-full border-2 border-ink bg-grid ${className}`}
    >
      <div className={`h-full ${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
