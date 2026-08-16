import Link from "next/link";
import type { ProjectSummary } from "@/lib/projects";
import { formatMinutes } from "@/lib/format";

export default function ProjectCard({ project }: { project: ProjectSummary }) {
  const statusTone =
    project.status === "completed"
      ? "bg-complete"
      : project.status === "in-progress"
        ? "bg-unlocked"
        : "bg-grid";

  const cta =
    project.status === "completed"
      ? "View"
      : project.status === "in-progress"
        ? "Continue →"
        : "Start →";

  return (
    <Link
      href={`/project/${project.id}`}
      className="flex flex-col gap-3 border-2 border-ink bg-cream p-4 transition-shadow hover:shadow-[4px_4px_0_#1e1e1e]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${statusTone}`}
        >
          {project.status === "completed"
            ? "Completed"
            : project.status === "in-progress"
              ? "In progress"
              : "Not started"}
        </span>
        <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {project.difficulty}
        </span>
        <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
          {project.category}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-black uppercase tracking-tight text-soot">
          {project.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm leading-5 text-soot/80">
          {project.description}
        </p>
      </div>

      {project.skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {project.skills.slice(0, 4).map((skill) => (
            <span
              key={skill.id}
              className="border border-ink bg-grid px-1.5 py-0.5 text-[11px] font-bold uppercase text-soot"
            >
              {skill.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs font-bold uppercase tracking-widest text-soot/60">
          {formatMinutes(project.estimatedMinutes)} · {project.progress.completed}/
          {project.progress.total} milestones
        </span>
        <span className="text-sm font-bold uppercase text-soot">{cta}</span>
      </div>
    </Link>
  );
}
