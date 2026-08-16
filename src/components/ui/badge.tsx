import type { ReactNode } from "react";

const TONES: Record<string, string> = {
  complete: "bg-complete",
  unlocked: "bg-unlocked",
  locked: "bg-locked",
  teal: "bg-teal",
  danger: "bg-danger",
  grid: "bg-grid",
  cream: "bg-cream",
};

export default function Badge({
  children,
  tone = "grid",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${
        TONES[tone] ?? TONES.grid
      } ${className}`}
    >
      {children}
    </span>
  );
}
