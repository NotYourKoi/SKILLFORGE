import Link from "next/link";
import type { ContinueLearningItem } from "@/lib/progression/overview";

export default function ContinueLearningCard({ item }: { item: ContinueLearningItem }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col gap-2 border-2 border-ink bg-teal p-5 shadow-[4px_4px_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1e1e1e]"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
        Continue learning
      </span>
      <h2 className="text-xl font-black uppercase tracking-tight text-soot">
        {item.skillName}
      </h2>
      {item.lesson ? (
        <p className="text-sm text-soot/80">
          Next up: <span className="font-bold">{item.lesson.title}</span>
        </p>
      ) : (
        <p className="text-sm text-soot/80">Start this skill.</p>
      )}
      <span className="mt-1 border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase text-soot">
        Continue →
      </span>
    </Link>
  );
}
