import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "./db";
import { getLessonReader } from "./queries";
import { highlightCode, languageLabel } from "./highlight";
import { completeLesson } from "./actions";
import LessonContent from "@/components/lesson/lesson-content";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-auth", () => {
  class AuthError extends Error {
    type: string;
    constructor(type = "") {
      super("Authentication error");
      this.type = type;
    }
  }
  return { AuthError };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { auth } from "@/auth";

const authMock = vi.mocked(auth);

let userId: string | null = null;
const skillIds: string[] = [];
const lessonIds: string[] = [];
const quizIds: string[] = [];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(): Promise<string> {
  const suffix = uid("u");
  const user = await prisma.user.create({
    data: {
      username: suffix,
      email: `${suffix}@test.local`,
      passwordHash: "not-a-real-hash",
    },
  });
  return user.id;
}

async function createSkill(
  id: string,
  x: number,
  y: number,
  prereqIds: string[] = [],
): Promise<void> {
  skillIds.push(id);
  await prisma.skill.create({
    data: {
      id,
      name: id,
      description: `${id} desc`,
      tier: "Core",
      x,
      y,
      prereqs: { create: prereqIds.map((prereqId) => ({ prereqId })) },
    },
  });
}

async function createLesson(skillId: string, order: number, checkpoints = "[]"): Promise<string> {
  const lesson = await prisma.lesson.create({
    data: {
      id: `${skillId}_L${order}`,
      skillId,
      title: `${skillId} lesson ${order}`,
      description: `${skillId} description ${order}`,
      estimatedMinutes: 10,
      difficulty: "Beginner",
      content: `## Learning Objectives\n- thing\n\n## Explanation\n\nSome ${order}.`,
      checkpoints,
      order,
    },
  });
  lessonIds.push(lesson.id);
  return lesson.id;
}

async function createQuiz(skillId: string): Promise<string> {
  const quiz = await prisma.quiz.create({
    data: {
      skillId,
      title: `${skillId} quiz`,
      passScore: 70,
      questions: {
        create: [
          {
            prompt: "q",
            order: 0,
            options: {
              create: [
                { text: "a", isCorrect: true, order: 0 },
                { text: "b", isCorrect: false, order: 1 },
              ],
            },
          },
        ],
      },
    },
  });
  quizIds.push(quiz.id);
  return quiz.id;
}

async function cleanup(): Promise<void> {
  if (userId) {
    await prisma.userSkill.deleteMany({ where: { userId } });
    await prisma.lessonProgress.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    userId = null;
  }
  for (const id of lessonIds) {
    await prisma.lesson.delete({ where: { id } }).catch(() => {});
  }
  lessonIds.length = 0;
  for (const id of quizIds) {
    await prisma.quiz.delete({ where: { id } }).catch(() => {});
  }
  quizIds.length = 0;
  for (const id of skillIds) {
    await prisma.prerequisite.deleteMany({ where: { skillId: id } });
    await prisma.prerequisite.deleteMany({ where: { prereqId: id } });
    await prisma.skill.delete({ where: { id } }).catch(() => {});
  }
  skillIds.length = 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null as never);
});

afterEach(async () => {
  await cleanup();
});

describe("highlight", () => {
  it("labels known and unknown languages", () => {
    expect(languageLabel("c")).toBe("C");
    expect(languageLabel("python")).toBe("Python");
    expect(languageLabel("klingon")).toBe("KLINGON");
    expect(languageLabel("")).toBe("Code");
  });

  it("highlights C code into spans", async () => {
    const html = await highlightCode("int main(void) { return 0; }", "c");
    expect(html).toContain("<pre");
    expect(html).toContain("<span");
  });

  it("falls back to plain text for unknown languages", async () => {
    const html = await highlightCode("plain", "not-a-language");
    expect(html).toContain("plain");
  });
});

describe("markdown rendering", () => {
  it("renders note and warning callouts from directives", () => {
    const html = renderToStaticMarkup(
      <LessonContent
        content={[
          "## Explanation",
          "",
          ":::note",
          "A handy tip lives here.",
          ":::",
          "",
          ":::warning",
          "Beware of this trap.",
          ":::",
        ].join("\n")}
      />,
    );
    expect(html).toContain("A handy tip lives here.");
    expect(html).toContain("Note</span>");
    expect(html).toContain("Beware of this trap.");
    expect(html).toContain("Common mistake</span>");
  });
});

describe("lesson reader", () => {
  it("returns null for an unknown lesson", async () => {
    userId = await createUser();
    expect(await getLessonReader("DOES_NOT_EXIST", userId!)).toBeNull();
  });

  it("orders lessons by their order field and reports index", async () => {
    userId = await createUser();
    await createSkill("READER_A", 0, 0);
    await createLesson("READER_A", 2);
    await createLesson("READER_A", 0);
    await createLesson("READER_A", 1);

    const first = await getLessonReader("READER_A_L0", userId!);
    expect(first!.index).toBe(0);
    expect(first!.total).toBe(3);
    expect(first!.prevLesson).toBeNull();
    expect(first!.nextLesson).toEqual({ id: "READER_A_L1", title: "READER_A lesson 1" });

    const middle = await getLessonReader("READER_A_L1", userId!);
    expect(middle!.index).toBe(1);
    expect(middle!.prevLesson!.id).toBe("READER_A_L0");
    expect(middle!.nextLesson!.id).toBe("READER_A_L2");

    const last = await getLessonReader("READER_A_L2", userId!);
    expect(last!.index).toBe(2);
    expect(last!.nextLesson).toBeNull();
    expect(last!.prevLesson!.id).toBe("READER_A_L1");
  });

  it("offers the quiz as the next step after the final lesson", async () => {
    userId = await createUser();
    await createSkill("READER_B", 0, 0);
    await createQuiz("READER_B");
    await createLesson("READER_B", 0);
    await createLesson("READER_B", 1);

    const last = await getLessonReader("READER_B_L1", userId!);
    expect(last!.nextLesson).toBeNull();
    expect(last!.quiz).not.toBeNull();
    expect(last!.quiz!.title).toBe("READER_B quiz");
  });

  it("points to the next unlocked skill after a completed skill", async () => {
    userId = await createUser();
    await createSkill("READER_C1", 0, 0);
    await createSkill("READER_C2", 0, 100, ["READER_C1"]);
    await createLesson("READER_C1", 0);

    await prisma.userSkill.create({
      data: { userId: userId!, skillId: "READER_C1", completed: true, completedAt: new Date() },
    });

    const reader = await getLessonReader("READER_C1_L0", userId!);
    expect(reader!.status).toBe("COMPLETED");
    expect(reader!.nextSkill).toEqual({ id: "READER_C2", name: "READER_C2" });
  });

  it("does not offer a next skill while the current skill is still unlocked", async () => {
    userId = await createUser();
    await createSkill("READER_D1", 0, 0);
    await createSkill("READER_D2", 0, 100, ["READER_D1"]);
    await createLesson("READER_D1", 0);

    const reader = await getLessonReader("READER_D1_L0", userId!);
    expect(reader!.status).toBe("UNLOCKED");
    expect(reader!.nextSkill).toBeNull();
  });

  it("parses stored checkpoints and reports lesson completion", async () => {
    userId = await createUser();
    await createSkill("READER_E", 0, 0);
    const id = await createLesson(
      "READER_E",
      0,
      JSON.stringify([
        {
          question: "Which one?",
          options: ["a", "b"],
          correctIndex: 1,
          explanation: "Because b.",
        },
      ]),
    );

    const reader = await getLessonReader(id, userId!);
    expect(reader!.lesson.checkpoints).toHaveLength(1);
    expect(reader!.lesson.checkpoints[0].correctIndex).toBe(1);
    expect(reader!.lesson.completed).toBe(false);
    expect(reader!.completedInSkill).toBe(0);

    authMock.mockResolvedValue({ user: { id: userId! } } as never);
    await completeLesson(id, "READER_E");

    const after = await getLessonReader(id, userId!);
    expect(after!.lesson.completed).toBe(true);
    expect(after!.completedInSkill).toBe(1);
  });

  it("returns empty checkpoints for malformed JSON", async () => {
    userId = await createUser();
    await createSkill("READER_F", 0, 0);
    const id = await createLesson("READER_F", 0, "{not json");

    const reader = await getLessonReader(id, userId!);
    expect(reader!.lesson.checkpoints).toEqual([]);
  });

  it("completing a lesson never completes the skill itself", async () => {
    userId = await createUser();
    await createSkill("READER_G", 0, 0);
    const id = await createLesson("READER_G", 0);

    await completeLesson(id, "READER_G");

    const userSkill = await prisma.userSkill.findUnique({
      where: { userId_skillId: { userId: userId!, skillId: "READER_G" } },
    });
    expect(userSkill?.completed ?? false).toBe(false);
  });
});
