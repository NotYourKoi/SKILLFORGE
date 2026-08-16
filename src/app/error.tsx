"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-black text-soot">!</p>
      <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-6 text-soot/70">
        An unexpected error interrupted this page. Your progress and account are
        safe — try again, or head home and continue where you left off.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="border-2 border-ink bg-complete px-5 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border-2 border-ink bg-cream px-5 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
