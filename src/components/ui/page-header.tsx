import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-soot">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm leading-6 text-soot/70">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
