"use client";

import { useState } from "react";

export default function CopyButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (e.g. non-secure contexts); ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 border-2 border-ink bg-cream px-2 py-0.5 text-xs font-bold uppercase text-soot hover:bg-grid"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
