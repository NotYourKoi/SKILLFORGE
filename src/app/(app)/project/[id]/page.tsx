import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProject } from "@/lib/projects";
import { formatMinutes } from "@/lib/format";
import ProjectMilestones from "@/components/project/project-milestones";
import ProjectHints from "@/components/project/project-hints";
import ProjectNotes from "@/components/project/project-notes";
import ProjectComplete from "@/components/project/project-complete";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const project = await getProject(id, session!.user!.id);

  if (!project) notFound();

  const difficultyTone: Record<string, string> = {
    Beginner: "bg-complete",
    Intermediate: "bg-unlocked",
    Advanced: "bg-danger",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/projects"
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
            {project.title}
          </h1>
          <span
            className={`border-2 border-ink px-2 py-0.5 text-xs font-bold uppercase text-soot ${difficultyTone[project.difficulty] ?? "bg-grid"}`}
          >
            {project.difficulty}
          </span>
          <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
            {project.category}
          </span>
          <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
            {formatMinutes(project.estimatedMinutes)}
          </span>
          {project.status === "completed" ? (
            <span className="border-2 border-ink bg-complete px-2 py-0.5 text-xs font-bold uppercase text-soot">
              Completed
            </span>
          ) : project.status === "in-progress" ? (
            <span className="border-2 border-ink bg-unlocked px-2 py-0.5 text-xs font-bold uppercase text-soot">
              In progress
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-soot/80">
          {project.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Project overview
            </h2>
            <p className="mt-3 text-sm leading-6 text-soot">{project.description}</p>
          </section>

          {project.objectives.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                What you&apos;ll learn
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {project.objectives.map((objective, i) => (
                  <li key={i} className="flex gap-2 text-sm text-soot">
                    <span className="text-soot/50">{i + 1}.</span>
                    {objective}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Requirements
            </h2>
            <p className="mt-2 text-xs text-soot/60">
              This is exactly what you are supposed to build. Every requirement
              below should be visibly true when you are done.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {project.requirements.map((requirement, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-5 text-soot"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-ink text-[10px] font-black">
                    {i + 1}
                  </span>
                  {requirement}
                </li>
              ))}
            </ul>
          </section>

          {project.expectedOutput ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Expected output
              </h2>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words border-2 border-ink bg-grid px-3 py-2 text-sm leading-6 text-soot">
                {project.expectedOutput}
              </pre>
            </section>
          ) : null}

          {project.milestones.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Milestones
              </h2>
              <div className="mt-3">
                <ProjectMilestones
                  projectId={project.id}
                  milestones={project.milestones}
                />
              </div>
            </section>
          ) : null}

          <ProjectHints hints={project.hints} />
        </div>

        <aside className="flex flex-col gap-5">
          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Project progress
            </h2>
            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-soot/70">
              <span>
                {project.progress.completed}/{project.progress.total} milestones
              </span>
              <span>{project.progress.percent}%</span>
            </div>
            <div className="mt-1 h-4 w-full border-2 border-ink bg-grid">
              <div
                className="h-full bg-complete transition-all"
                style={{ width: `${project.progress.percent}%` }}
              />
            </div>
            {project.completedAt ? (
              <p className="mt-3 text-xs text-soot/70">
                Completed on{" "}
                <span className="font-bold">
                  {project.completedAt.toLocaleDateString()}
                </span>
              </p>
            ) : (
              <p className="mt-3 text-xs text-soot/60">
                Finish every milestone to complete the project — or use the
                button below to mark it done manually.
              </p>
            )}
            <div className="mt-3">
              <ProjectComplete projectId={project.id} completed={project.status === "completed"} />
            </div>
          </section>

          {project.skills.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Skills required
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {project.skills.map((skill, i) => (
                  <li key={skill.id}>
                    <Link
                      href={`/skill/${skill.id}`}
                      className="flex items-center justify-between border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                    >
                      <span>
                        {i === 0 ? (
                          <span className="mr-2 text-[10px] uppercase opacity-60">Primary</span>
                        ) : null}
                        {skill.name}
                      </span>
                      <span className="text-xs uppercase opacity-70">Open →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.resources.lessons.length > 0 ||
          project.resources.exercises.length > 0 ||
          project.resources.courses.length > 0 ? (
            <section className="border-2 border-ink bg-cream p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
                Before starting
              </h2>
              <p className="mt-2 text-xs text-soot/60">
                Brush up with these — they reuse existing SkillForge content.
              </p>

              {project.resources.lessons.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
                    Recommended lessons
                  </span>
                  {project.resources.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/skill/${lesson.skillId}/lesson/${lesson.id}`}
                      className="border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                    >
                      <span className="block text-xs uppercase opacity-60">
                        {lesson.skillName}
                      </span>
                      {lesson.title}
                    </Link>
                  ))}
                </div>
              ) : null}

              {project.resources.exercises.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
                    Recommended exercises
                  </span>
                  {project.resources.exercises.map((exercise) => (
                    <Link
                      key={exercise.id}
                      href={`/exercise/${exercise.id}`}
                      className="border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                    >
                      {exercise.title}
                    </Link>
                  ))}
                </div>
              ) : null}

              {project.resources.courses.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-soot/70">
                    Related courses
                  </span>
                  {project.resources.courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/course/${course.slug}`}
                      className="border-2 border-ink bg-grid px-3 py-2 text-sm font-bold text-soot hover:bg-teal"
                    >
                      {course.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="border-2 border-ink bg-cream p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
              Private notes
            </h2>
            <p className="mt-2 text-xs text-soot/60">
              Only you can see these. They stay on your account.
            </p>
            <div className="mt-3">
              <ProjectNotes projectId={project.id} initialNotes={project.notes} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
