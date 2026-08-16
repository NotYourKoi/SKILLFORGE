import { prisma } from "@/lib/db";
import {
  cascadeUncomplete,
  deriveStatus,
  deriveStatuses,
  type SkillGraphNode,
  type SkillStatus,
} from "@/lib/roadmap";

export interface RoadmapSkill {
  id: string;
  name: string;
  description: string;
  tier: string;
  x: number;
  y: number;
  prereqIds: string[];
  status: SkillStatus;
}

export async function getCompletedSkillIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.userSkill.findMany({
    where: { userId, completed: true },
    select: { skillId: true },
  });
  return new Set(rows.map((row) => row.skillId));
}

export async function getSkillGraph(): Promise<SkillGraphNode[]> {
  const [skills, prereqs] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ x: "asc" }, { y: "asc" }] }),
    prisma.prerequisite.findMany(),
  ]);

  const prereqIdsBySkill = new Map<string, string[]>();
  for (const prereq of prereqs) {
    const list = prereqIdsBySkill.get(prereq.skillId) ?? [];
    list.push(prereq.prereqId);
    prereqIdsBySkill.set(prereq.skillId, list);
  }

  return skills.map((skill) => ({
    id: skill.id,
    prereqIds: prereqIdsBySkill.get(skill.id) ?? [],
  }));
}

export async function getRoadmap(userId: string): Promise<RoadmapSkill[]> {
  const [skills, prereqs, completed] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ x: "asc" }, { y: "asc" }] }),
    prisma.prerequisite.findMany(),
    getCompletedSkillIds(userId),
  ]);

  const prereqIdsBySkill = new Map<string, string[]>();
  for (const prereq of prereqs) {
    const list = prereqIdsBySkill.get(prereq.skillId) ?? [];
    list.push(prereq.prereqId);
    prereqIdsBySkill.set(prereq.skillId, list);
  }

  const nodes = skills.map((skill) => ({
    id: skill.id,
    prereqIds: prereqIdsBySkill.get(skill.id) ?? [],
  }));
  const statuses = deriveStatuses(nodes, completed);

  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    tier: skill.tier,
    x: skill.x,
    y: skill.y,
    prereqIds: prereqIdsBySkill.get(skill.id) ?? [],
    status: statuses.get(skill.id) ?? "LOCKED",
  }));
}

export async function getSkillDetail(skillId: string, userId: string) {
  const [skill, completed] = await Promise.all([
    prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        prereqs: { include: { prereq: true } },
        dependents: { include: { skill: true } },
        lessons: { orderBy: { order: "asc" } },
        quizzes: {
          include: { questions: { select: { _count: { select: { options: true } } } } },
        },
      },
    }),
    getCompletedSkillIds(userId),
  ]);

  if (!skill) return null;

  const node: SkillGraphNode = {
    id: skill.id,
    prereqIds: skill.prereqs.map((p) => p.prereqId),
  };
  const status = deriveStatus(node, completed);

  const lessons = skill.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, order: lesson.order }));
  const quizzes = skill.quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    passScore: quiz.passScore,
    questionCount: quiz.questions.reduce((sum, q) => sum + q._count.options, 0),
  }));

  let objectives: string[] = [];
  try {
    const parsed = JSON.parse(skill.objectives);
    if (Array.isArray(parsed)) objectives = parsed;
  } catch {
    objectives = [];
  }

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    tier: skill.tier,
    x: skill.x,
    y: skill.y,
    status,
    objectives,
    prereqs: skill.prereqs.map((p) => ({ id: p.prereqId, name: p.prereq.name })),
    dependents: skill.dependents.map((d) => ({ id: d.skill.id, name: d.skill.name })),
    lessons,
    quizzes,
  };
}

export interface UserStats {
  total: number;
  completed: number;
  unlocked: number;
  locked: number;
  progressPercent: number;
  recentAttempts: {
    id: string;
    quizTitle: string;
    skillName: string;
    score: number;
    passed: boolean;
    takenAt: Date;
  }[];
  completedSkills: {
    id: string;
    name: string;
    completedAt: Date | null;
  }[];
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const [skills, prereqs, userSkills, recentAttempts] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ x: "asc" }, { y: "asc" }] }),
    prisma.prerequisite.findMany(),
    prisma.userSkill.findMany({
      where: { userId, completed: true },
      include: { skill: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { takenAt: "desc" },
      take: 5,
      include: { quiz: { include: { skill: true } } },
    }),
  ]);

  const prereqIdsBySkill = new Map<string, string[]>();
  for (const prereq of prereqs) {
    const list = prereqIdsBySkill.get(prereq.skillId) ?? [];
    list.push(prereq.prereqId);
    prereqIdsBySkill.set(prereq.skillId, list);
  }

  const completed = new Set(userSkills.map((us) => us.skillId));
  const nodes = skills.map((skill) => ({
    id: skill.id,
    prereqIds: prereqIdsBySkill.get(skill.id) ?? [],
  }));
  const statuses = deriveStatuses(nodes, completed);

  const counts = { completed: 0, unlocked: 0, locked: 0 };
  for (const status of statuses.values()) {
    if (status === "COMPLETED") counts.completed++;
    else if (status === "UNLOCKED") counts.unlocked++;
    else counts.locked++;
  }

  return {
    total: skills.length,
    ...counts,
    progressPercent: skills.length === 0 ? 0 : Math.round((counts.completed / skills.length) * 100),
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      quizTitle: attempt.quiz.title,
      skillName: attempt.quiz.skill.name,
      score: attempt.score,
      passed: attempt.passed,
      takenAt: attempt.takenAt,
    })),
    completedSkills: userSkills.map((us) => ({
      id: us.skillId,
      name: us.skill.name,
      completedAt: us.completedAt,
    })),
  };
}

export type ToggleResult = { ok: true } | { ok: false; error: string };

export async function toggleSkillCompletion(userId: string, skillId: string): Promise<ToggleResult> {
  const nodes = await getSkillGraph();
  const node = nodes.find((n) => n.id === skillId);
  if (!node) return { ok: false, error: "Skill not found" };

  const completed = await getCompletedSkillIds(userId);
  const wasCompleted = completed.has(skillId);

  if (!wasCompleted && deriveStatus(node, completed) === "LOCKED") {
    return { ok: false, error: "Complete the prerequisite skills first" };
  }

  const next = wasCompleted
    ? cascadeUncomplete(nodes, completed, skillId)
    : new Set(completed).add(skillId);

  await prisma.$transaction(async (tx) => {
    for (const id of next) {
      if (!completed.has(id)) {
        await tx.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: id } },
          create: { userId, skillId: id, completed: true, completedAt: new Date() },
          update: { completed: true, completedAt: new Date() },
        });
      }
    }
    for (const id of completed) {
      if (!next.has(id)) {
        await tx.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: id } },
          create: { userId, skillId: id, completed: false, completedAt: null },
          update: { completed: false, completedAt: null },
        });
      }
    }
  });

  return { ok: true };
}

export async function getLesson(lessonId: string, userId: string) {
  const [lesson, progress] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { skill: { select: { id: true, name: true } } },
    }),
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    }),
  ]);
  if (!lesson) return null;

  return {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    order: lesson.order,
    completed: progress?.completed ?? false,
    skill: lesson.skill,
  };
}

export interface LessonReaderCheckpoint {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonReader {
  lesson: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    difficulty: string;
    content: string;
    checkpoints: LessonReaderCheckpoint[];
    completed: boolean;
  };
  skill: { id: string; name: string };
  status: SkillStatus;
  index: number;
  total: number;
  completedInSkill: number;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  quiz: { id: string; title: string } | null;
  nextSkill: { id: string; name: string } | null;
}

export async function getLessonReader(lessonId: string, userId: string): Promise<LessonReader | null> {
  const [lesson, progress, roadmap] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } },
            quizzes: { take: 1, select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    }),
    getRoadmap(userId),
  ]);

  if (!lesson) return null;

  const lessons = lesson.skill.lessons;
  const index = lessons.findIndex((l) => l.id === lessonId);
  const total = lessons.length;

  const lessonIds = lessons.map((l) => l.id);
  const completedRows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, completed: true },
    select: { lessonId: true },
  });

  const status = roadmap.find((s) => s.id === lesson.skill.id)?.status ?? "LOCKED";
  const currentIdx = roadmap.findIndex((s) => s.id === lesson.skill.id);
  const next = roadmap.slice(currentIdx + 1).find((s) => s.status === "UNLOCKED");

  let checkpoints: LessonReaderCheckpoint[] = [];
  try {
    const parsed = JSON.parse(lesson.checkpoints);
    if (Array.isArray(parsed)) checkpoints = parsed;
  } catch {
    checkpoints = [];
  }

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      difficulty: lesson.difficulty,
      content: lesson.content,
      checkpoints,
      completed: progress?.completed ?? false,
    },
    skill: lesson.skill,
    status,
    index,
    total,
    completedInSkill: completedRows.length,
    prevLesson: index > 0 ? { id: lessons[index - 1].id, title: lessons[index - 1].title } : null,
    nextLesson:
      index >= 0 && index < total - 1
        ? { id: lessons[index + 1].id, title: lessons[index + 1].title }
        : null,
    quiz: lesson.skill.quizzes[0] ?? null,
    nextSkill: next ? { id: next.id, name: next.name } : null,
  };
}

export interface QuizForRunner {
  id: string;
  title: string;
  passScore: number;
  skill: { id: string; name: string };
  questions: {
    id: string;
    prompt: string;
    order: number;
    options: { id: string; text: string; order: number }[];
  }[];
  lastAttempt: { score: number; passed: boolean; takenAt: Date } | null;
}

export async function getQuizForRunner(quizId: string, userId: string): Promise<QuizForRunner | null> {
  const [quiz, lastAttempt] = await Promise.all([
    prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        skill: { select: { id: true, name: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
              select: { id: true, text: true, order: true },
            },
          },
        },
      },
    }),
    prisma.quizAttempt.findFirst({
      where: { userId, quizId },
      orderBy: { takenAt: "desc" },
    }),
  ]);
  if (!quiz) return null;

  return {
    id: quiz.id,
    title: quiz.title,
    passScore: quiz.passScore,
    skill: quiz.skill,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      order: q.order,
      options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
    })),
    lastAttempt: lastAttempt
      ? { score: lastAttempt.score, passed: lastAttempt.passed, takenAt: lastAttempt.takenAt }
      : null,
  };
}

export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { include: { skill: true } },
      answers: {
        include: {
          question: true,
          option: true,
        },
      },
    },
  });
  if (!attempt || attempt.userId !== userId) return null;

  return {
    id: attempt.id,
    score: attempt.score,
    passed: attempt.passed,
    takenAt: attempt.takenAt,
    passScore: attempt.quiz.passScore,
    quizTitle: attempt.quiz.title,
    skill: attempt.quiz.skill,
    answers: attempt.answers.map((a) => ({
      prompt: a.question.prompt,
      selectedText: a.option.text,
      selectedCorrect: a.option.isCorrect,
    })),
  };
}

export interface SkillProgressDetail {
  skillId: string;
  skillName: string;
  totalLessons: number;
  completedLessons: number;
  lessonsCompleted: boolean;
  quizAttempts: {
    id: string;
    quizTitle: string;
    score: number;
    passed: boolean;
    takenAt: Date;
  }[];
  lastQuiz: { score: number; passed: boolean; takenAt: Date } | null;
}

export async function getUserProgress(userId: string): Promise<SkillProgressDetail[]> {
  const [lessons, lessonProgress, attempts] = await Promise.all([
    prisma.lesson.findMany({
      include: { skill: { select: { id: true, name: true } } },
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
    }),
    prisma.lessonProgress.findMany({ where: { userId, completed: true } }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { takenAt: "desc" },
      include: { quiz: { include: { skill: true } } },
    }),
  ]);

  const completedSet = new Set(lessonProgress.map((p) => p.lessonId));

  const bySkill = new Map<string, SkillProgressDetail>();
  for (const lesson of lessons) {
    let detail = bySkill.get(lesson.skill.id);
    if (!detail) {
      detail = {
        skillId: lesson.skill.id,
        skillName: lesson.skill.name,
        totalLessons: 0,
        completedLessons: 0,
        lessonsCompleted: false,
        quizAttempts: [],
        lastQuiz: null,
      };
      bySkill.set(lesson.skill.id, detail);
    }
    detail.totalLessons++;
    if (completedSet.has(lesson.id)) detail.completedLessons++;
  }

  for (const attempt of attempts) {
    const detail = bySkill.get(attempt.quiz.skillId);
    if (!detail) continue;
    detail.quizAttempts.push({
      id: attempt.id,
      quizTitle: attempt.quiz.title,
      score: attempt.score,
      passed: attempt.passed,
      takenAt: attempt.takenAt,
    });
  }

  const details = [...bySkill.values()];
  for (const detail of details) {
    detail.lessonsCompleted =
      detail.totalLessons > 0 && detail.completedLessons === detail.totalLessons;
    detail.lastQuiz = detail.quizAttempts[0]
      ? {
          score: detail.quizAttempts[0].score,
          passed: detail.quizAttempts[0].passed,
          takenAt: detail.quizAttempts[0].takenAt,
        }
      : null;
  }

  return details;
}
