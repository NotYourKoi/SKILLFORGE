import type { ReactNode } from "react";

export default function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-2 border-ink bg-cream p-5">
      <p className="text-sm font-bold uppercase tracking-widest text-soot">{title}</p>
      {children ? <div className="mt-2 text-sm leading-6 text-soot/70">{children}</div> : null}
    </div>
  );
}
