import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  computeRelevance,
  difficultyGroup,
  getSearchFacets,
  normalizeSearchText,
  searchContent,
  searchCourses,
  searchExercises,
  searchLessons,
  searchProjects,
  searchSkills,
} from "./search";

describe("normalizeSearchText", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeSearchText("  Python!!  Basics   ")).toBe("python basics");
    expect(normalizeSearchText("HTML & CSS")).toBe("html css");
    expect(normalizeSearchText("   ")).toBe("");
    expect(normalizeSearchText("")).toBe("");
  });
});

describe("computeRelevance", () => {
  it("ranks an exact title match above a partial match", () => {
    const exact = computeRelevance("python basics", "Python Basics", "", []);
    const partial = computeRelevance("python", "Python Basics", "", []);
    expect(exact).toBe(100);
    expect(partial).toBe(80);
    expect(exact).toBeGreaterThan(partial);
  });

  it("is case-insensitive", () => {
    expect(computeRelevance("PYTHON", "Python Basics", "", [])).toBe(
      computeRelevance("python", "Python Basics", "", []),
    );
  });

  it("is whitespace tolerant", () => {
    expect(computeRelevance("python  basics", "Python Basics", "", [])).toBe(100);
  });

  it("ranks a title that starts with the query above a contains match", () => {
    const starts = computeRelevance("python", "Python Basics", "", []);
    const contains = computeRelevance("basics", "Python Basics", "", []);
    expect(starts).toBe(80);
    expect(contains).toBe(60);
    expect(starts).toBeGreaterThan(contains);
  });

  it("matches against the description with a lower score", () => {
    const score = computeRelevance(
      "client server",
      "Web Basics",
      "How clients and servers talk over HTTP.",
      [],
    );
    expect(score).toBe(40);
  });

  it("matches metadata with the lowest score", () => {
    const score = computeRelevance("web development", "Some Course", "desc", [
      "Web Development",
    ]);
    expect(score).toBe(20);
  });

  it("returns 0 when not every token matches", () => {
    expect(computeRelevance("python machine", "Python Basics", "desc", [])).toBe(0);
  });

  it("returns 0 for an empty query", () => {
    expect(computeRelevance("   ", "Python Basics", "desc", [])).toBe(0);
  });
});

describe("difficultyGroup", () => {
  it("maps exercise difficulty labels into the standard vocabulary", () => {
    expect(difficultyGroup("Easy")).toBe("Beginner");
    expect(difficultyGroup("Medium")).toBe("Intermediate");
    expect(difficultyGroup("Hard")).toBe("Advanced");
    expect(difficultyGroup("Beginner")).toBe("Beginner");
  });
});

describe("searchContent (database-backed)", () => {
  const createdCourses: string[] = [];
  const createdSkills: string[] = [];
  const createdLessons: string[] = [];
  const createdExercises: string[] = [];
  const createdProjects: string[] = [];

  function uid(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async function createSkill(id: string, name: string): Promise<string> {
    createdSkills.push(id);
    await prisma.skill.create({
      data: { id, name, description: `${name} deep description`, tier: "Core", x: 0, y: 0 },
    });
    return id;
  }

  async function createCourse(courseId: string, opts: {
    title: string;
    category?: string;
    difficulty?: string;
    slug?: string;
  }): Promise<string> {
    createdCourses.push(courseId);
    await prisma.course.create({
      data: {
        id: courseId,
        slug: opts.slug ?? uid("slug"),
        title: opts.title,
        description: `${opts.title} course description`,
        category: opts.category ?? "Programming",
        difficulty: opts.difficulty ?? "Beginner",
        estimatedMinutes: 30,
        objectives: "[]",
      },
    });
    return courseId;
  }

  async function createLesson(skillId: string, title: string): Promise<string> {
    const lesson = await prisma.lesson.create({
      data: { skillId, title, content: "c", description: `${title} lesson`, order: 0 },
    });
    createdLessons.push(lesson.id);
    return lesson.id;
  }

  async function createExercise(skillId: string, title: string, difficulty = "Easy"): Promise<string> {
    const exercise = await prisma.exercise.create({
      data: {
        skillId,
        title,
        prompt: `${title} prompt`,
        language: "python",
        difficulty,
        order: 0,
      },
    });
    createdExercises.push(exercise.id);
    return exercise.id;
  }

  async function createProject(projectId: string, title: string, category: string, skillId: string): Promise<string> {
    createdProjects.push(projectId);
    await prisma.project.create({
      data: {
        id: projectId,
        skillId,
        title,
        description: `${title} project`,
        category,
        difficulty: "Beginner",
        estimatedMinutes: 60,
        objectives: "[]",
        requirements: "[]",
        hints: "[]",
        milestones: "[]",
        expectedOutput: "",
      },
    });
    return projectId;
  }

  afterEach(async () => {
    for (const id of createdLessons) await prisma.lesson.delete({ where: { id } }).catch(() => {});
    createdLessons.length = 0;
    for (const id of createdExercises) await prisma.exercise.delete({ where: { id } }).catch(() => {});
    createdExercises.length = 0;
    for (const id of createdProjects) await prisma.project.delete({ where: { id } }).catch(() => {});
    createdProjects.length = 0;
    for (const id of createdCourses) await prisma.course.delete({ where: { id } }).catch(() => {});
    createdCourses.length = 0;
    for (const id of createdSkills) await prisma.skill.delete({ where: { id } }).catch(() => {});
    createdSkills.length = 0;
  });

  it("returns nothing for an empty query", async () => {
    await createSkill("SEARCH_EMPTY_A", "Alpha Skill");
    expect(await searchContent("   ")).toEqual([]);
  });

  it("matches case-insensitively across types", async () => {
    await createSkill("SEARCH_CI_SKILL", "Rusty Rails");
    await createCourse("SEARCH_CI_COURSE", { title: "Rusty Rails Course" });

    const results = await searchContent("RUSTY RAILS");
    const types = new Set(results.map((r) => r.type));
    expect(types).toContain("skill");
    expect(types).toContain("course");
  });

  it("ranks an exact title match above a description-only match", async () => {
    await createSkill("SEARCH_RANK_TITLE", "Quantum Quilting");
    await createSkill("SEARCH_RANK_DESC", "Other Skill");
    await prisma.skill.update({
      where: { id: "SEARCH_RANK_DESC" },
      data: { description: "learn all about quantum quilting patterns" },
    });

    const results = await searchContent("quantum quilting");
    expect(results[0].title).toBe("Quantum Quilting");
    expect(results[0].relevance).toBeGreaterThan(results[1].relevance);
  });

  it("filters by content type", async () => {
    await createSkill("SEARCH_TYPE_SKILL", "Fortran Fundamentals");
    await createCourse("SEARCH_TYPE_COURSE", { title: "Fortran Fundamentals Course" });

    const skills = await searchSkills("fortran fundamentals");
    expect(skills.every((r) => r.type === "skill")).toBe(true);
    const courses = await searchCourses("fortran fundamentals");
    expect(courses.every((r) => r.type === "course")).toBe(true);
  });

  it("filters by difficulty, mapping exercise labels into the standard set", async () => {
    const skillId = await createSkill("SEARCH_DIFF_SKILL", "Diff Skill");
    await createExercise(skillId, "Easy Exercise", "Easy");
    await createExercise(skillId, "Hard Exercise", "Hard");

    const beginner = await searchContent("exercise", { difficulty: "Beginner" });
    const advanced = await searchContent("exercise", { difficulty: "Advanced" });
    expect(beginner.some((r) => r.title === "Easy Exercise")).toBe(true);
    expect(beginner.some((r) => r.title === "Hard Exercise")).toBe(false);
    expect(advanced.some((r) => r.title === "Hard Exercise")).toBe(true);
  });

  it("filters by category", async () => {
    await createCourse("SEARCH_CAT_A", { title: "Category Course", category: "Programming" });
    await createCourse("SEARCH_CAT_B", { title: "Another Category Course", category: "Data" });

    const programming = await searchContent("course", { category: "Programming" });
    const data = await searchContent("course", { category: "Data" });
    expect(programming.every((r) => r.category === "Programming")).toBe(true);
    expect(data.every((r) => r.category === "Data")).toBe(true);
  });

  it("supports the per-type search helpers", async () => {
    await createSkill("SEARCH_HELP_SKILL", "Helpful Skill");
    await createCourse("SEARCH_HELP_COURSE", { title: "Helpful Course" });
    await createLesson("SEARCH_HELP_SKILL", "Helpful Lesson");
    await createExercise("SEARCH_HELP_SKILL", "Helpful Exercise");
    await createProject("SEARCH_HELP_PROJECT", "Helpful Project", "Web App", "SEARCH_HELP_SKILL");

    expect((await searchLessons("helpful")).every((r) => r.type === "lesson")).toBe(true);
    expect((await searchExercises("helpful")).every((r) => r.type === "exercise")).toBe(true);
    expect((await searchProjects("helpful")).every((r) => r.type === "project")).toBe(true);
  });

  it("returns no results for a query with no matches", async () => {
    await createSkill("SEARCH_NONE_SKILL", "Unique Skill Name");
    expect(await searchContent("zzz nothing matches zzz")).toEqual([]);
  });

  it("is deterministic across repeated calls", async () => {
    await createSkill("SEARCH_DET_A", "Det Alpha");
    await createCourse("SEARCH_DET_B", { title: "Det Bravo" });

    const first = await searchContent("det");
    const second = await searchContent("det");
    expect(first.map((r) => `${r.type}:${r.id}`)).toEqual(second.map((r) => `${r.type}:${r.id}`));
  });

  it("exposes dynamic facets derived from the database", async () => {
    await createSkill("SEARCH_FACET_SKILL", "Facet Skill");
    await createCourse("SEARCH_FACET_A", { title: "Facet Course", category: "Robotics" });
    await createCourse("SEARCH_FACET_B", { title: "Hard Facet Course", difficulty: "Advanced" });

    const facets = await getSearchFacets();
    expect(facets.categories).toContain("Robotics");
    expect(facets.difficulties).toContain("Beginner");
    expect(facets.difficulties).toContain("Advanced");
  });
});
