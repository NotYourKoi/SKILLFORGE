import type { ReactNode } from "react";

export default function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot"
    >
      {children}
    </div>
  );
}
