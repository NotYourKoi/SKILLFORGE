import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getQuizForRunner } from "@/lib/queries";
import QuizRunner from "@/components/quiz-runner";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const session = await auth();
  const quiz = await getQuizForRunner(quizId, session!.user!.id);

  if (!quiz || quiz.questions.length === 0 || quiz.skill.id !== id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/skill/${id}`}
          className="text-sm font-bold uppercase text-soot/70 hover:text-soot"
        >
          ← {quiz.skill.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
            {quiz.title}
          </h1>
          <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
            Pass at {quiz.passScore}%
          </span>
        </div>
      </div>

      <QuizRunner
        quizId={quiz.id}
        skillId={id}
        passScore={quiz.passScore}
        questions={quiz.questions}
        lastAttempt={quiz.lastAttempt}
      />
    </div>
  );
}
