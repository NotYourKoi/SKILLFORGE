"use client";

import { useState } from "react";
import { saveProjectNotes } from "@/lib/actions";

/** Private notes for a project. Saved on demand; only visible to the owner. */
export default function ProjectNotes({
  projectId,
  initialNotes,
}: {
  projectId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const res = await saveProjectNotes(projectId, notes);
    if (res.error) {
      setError(res.error);
      setSaved(false);
    } else {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={5}
        placeholder="Jot down ideas, links, or what you want to try next..."
        className="w-full resize-y border-2 border-ink bg-cream px-3 py-2 text-sm text-soot outline-none focus:bg-white"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="border-2 border-ink bg-unlocked px-3 py-1 text-xs font-bold uppercase text-soot hover:opacity-80 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save notes"}
        </button>
        {saved ? <span className="text-xs font-bold text-soot">Saved ✓</span> : null}
        {error ? <span className="text-xs font-bold text-danger">{error}</span> : null}
      </div>
    </div>
  );
}
