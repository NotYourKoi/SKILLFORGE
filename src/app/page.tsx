import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import SiteHeader from "@/components/site-header";
import SkipLink from "@/components/ui/skip-link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Learn Programming, Build Real Skills, For Free`,
  description: SITE_DESCRIPTION,
};

const FEATURES = [
  {
    title: "Structured courses",
    body: "Free, ready-made paths across Programming, Web, Computer Science, Python and AI/ML — with a start point and a finish line.",
    tone: "bg-teal",
  },
  {
    title: "Interactive lessons",
    body: "Short, focused lessons with examples, callouts and checkpoints so each concept sticks before you move on.",
    tone: "bg-unlocked",
  },
  {
    title: "Quizzes that prove it",
    body: "Finish each skill with a quiz. Pass it and the skill is yours — complete prerequisites to unlock the next node.",
    tone: "bg-complete",
  },
  {
    title: "Coding practice",
    body: "Real exercises with a built-in editor, visible test results and progressive hints — write code, not just read about it.",
    tone: "bg-grid",
  },
  {
    title: "Hands-on projects",
    body: "Build something real by working through milestones. Track what you have done and keep private notes as you go.",
    tone: "bg-danger",
  },
  {
    title: "Progress & goals",
    body: "XP, levels, streaks and achievements — plus course goals and a learning path that tells you exactly what to do next.",
    tone: "bg-unlocked",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader
        authenticated={Boolean(session?.user)}
        username={session?.user?.username}
      />

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="border-2 border-ink bg-teal px-3 py-1 text-sm font-bold uppercase tracking-widest text-soot">
            Skill Forge
          </span>
          <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-soot sm:text-6xl">
            Learn Programming.
            <br />
            Build Real Skills.
            <br />
            For Free.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-soot/80">
            SkillForge is a free, game-style learning platform. Work through
            structured courses, interactive lessons and quizzes, practice with
            coding exercises, and build real projects — unlocking new skills on
            your roadmap as you go.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={session?.user ? "/dashboard" : "/register"}
              className="border-2 border-ink bg-complete px-6 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#1e1e1e]"
            >
              Start Learning
            </Link>
            <Link
              href="/courses"
              className="border-2 border-ink bg-cream px-6 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#1e1e1e]"
            >
              Browse Courses
            </Link>
            <Link
              href="/explore"
              className="border-2 border-ink bg-grid px-6 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#1e1e1e]"
            >
              Explore
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <h2 id="features-heading" className="sr-only">
            What you get
          </h2>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border-2 border-ink bg-cream p-4">
              <span
                className={`mb-2 inline-block h-3 w-3 border border-ink ${feature.tone}`}
                aria-hidden="true"
              />
              <h3 className="font-bold uppercase text-soot">{feature.title}</h3>
              <p className="mt-1 text-sm leading-6 text-soot/75">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 border-2 border-ink bg-cream p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-soot">
            Get an AI tutor when you are stuck
          </h2>
          <p className="mt-2 text-sm leading-6 text-soot/80">
            The AI Tutor is an optional helper on lessons, quizzes and exercises.
            It guides you toward answers instead of handing them over — and you
            can turn it off at any time. The tutor is not required to learn, and
            it may be unavailable depending on configuration.
          </p>
          <Link
            href={session?.user ? "/dashboard" : "/register"}
            className="mt-4 inline-block border-2 border-ink bg-unlocked px-5 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
          >
            {session?.user ? "Go to your dashboard" : "Create a free account"}
          </Link>
        </section>

        <p className="mt-12 text-center text-xs font-bold uppercase tracking-widest text-soot/50">
          Free forever — no paywall, ever.
        </p>
      </main>

      <footer className="border-t-2 border-ink bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
          <p className="text-sm font-bold uppercase tracking-widest text-soot">
            Skill Forge
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold uppercase text-soot">
            <Link href="/courses" className="hover:underline">
              Courses
            </Link>
            <Link href="/explore" className="hover:underline">
              Explore
            </Link>
            <Link href="/roadmap" className="hover:underline">
              Roadmap
            </Link>
            <Link href="/search" className="hover:underline">
              Search
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
