import { highlightCode, languageLabel } from "@/lib/highlight";
import CopyButton from "./copy-button";

export default async function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const html = await highlightCode(code, language);
  const label = languageLabel(language);

  return (
    <figure className="lesson-code my-4 border-2 border-ink bg-grid">
      <figcaption className="flex items-center justify-between gap-3 border-b-2 border-ink bg-cream px-3 py-1">
        <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
          {label}
        </span>
        <CopyButton code={code} label="Copy code" />
      </figcaption>
      <div
        tabIndex={0}
        className="max-h-96 overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-unlocked"
        role="region"
        aria-label={`${label} code example — scroll horizontally to view`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
