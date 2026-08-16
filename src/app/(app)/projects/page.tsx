import { auth } from "@/auth";
import { getProjects } from "@/lib/projects";
import ProjectFilters from "@/components/project/project-filters";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await getProjects(session!.user!.id);

  const startedCount = projects.filter(
    (project) => project.status !== "not-started",
  ).length;
  const completedCount = projects.filter(
    (project) => project.status === "completed",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Projects
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-soot/70">
          Build something real. Pick a project that matches the skills you are
          learning and work through its milestones — each one you finish moves
          you closer to mastery.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot/60">
          <span className="border-2 border-ink bg-grid px-2 py-0.5">
            {projects.length} projects
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5">
            {startedCount} started
          </span>
          <span className="border-2 border-ink bg-complete px-2 py-0.5">
            {completedCount} completed
          </span>
        </div>
      </div>

      <ProjectFilters projects={projects} />
    </div>
  );
}
