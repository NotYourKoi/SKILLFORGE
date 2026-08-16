import { describe, expect, it } from "vitest";
import {
  findUnmetPrereq,
  rankRecommendations,
  topologicalOrder,
  type RecommendationState,
} from "@/lib/recommendations";
import type { SkillStatus } from "@/lib/roadmap";

function makeState(overrides: Partial<RecommendationState> = {}): RecommendationState {
  return {
    skills: [
      { id: "A", name: "Alpha", description: "First skill" },
      { id: "B", name: "Bravo", description: "Second skill" },
      { id: "C", name: "Charlie", description: "Third skill" },
    ],
    skillPrereqs: new Map([
      ["B", ["A"]],
      ["C", ["B"]],
    ]),
    statuses: new Map([
      ["A", "UNLOCKED"],
      ["B", "LOCKED"],
      ["C", "LOCKED"],
    ]),
    lessons: [
      { id: "L_A1", title: "Alpha One", skillId: "A" },
      { id: "L_A2", title: "Alpha Two", skillId: "A" },
      { id: "L_B1", title: "Bravo One", skillId: "B" },
    ],
    lessonProgress: [],
    exercises: [{ id: "E_A1", title: "Alpha Exercise", difficulty: "Easy", skillId: "A" }],
    exerciseProgress: [],
    projects: [{ id: "P_A", title: "Alpha Project", category: "CLI Tool", skillIds: ["A"] }],
    projectProgress: [],
    goals: [],
    courseSkills: new Map(),
    courseNames: new Map(),
    ...overrides,
  };
}

describe("topologicalOrder", () => {
  it("orders prerequisites before dependents", () => {
    const skills = [
      { id: "A" },
      { id: "B" },
      { id: "C" },
    ];
    const prereqs = new Map([
      ["B", ["A"]],
      ["C", ["B"]],
    ]);
    expect(topologicalOrder(skills, prereqs)).toEqual(["A", "B", "C"]);
  });

  it("is deterministic regardless of input order", () => {
    const skills = [
      { id: "C" },
      { id: "A" },
      { id: "B" },
    ];
    const prereqs = new Map([
      ["B", ["A"]],
      ["C", ["B"]],
    ]);
    expect(topologicalOrder(skills, prereqs)).toEqual(["A", "B", "C"]);
  });

  it("breaks cycles without hanging", () => {
    const skills = [{ id: "A" }, { id: "B" }];
    const prereqs = new Map([
      ["A", ["B"]],
      ["B", ["A"]],
    ]);
    expect(topologicalOrder(skills, prereqs)).toHaveLength(2);
  });
});

describe("findUnmetPrereq", () => {
  it("returns the nearest actionable unlocked prerequisite", () => {
    const prereqs = new Map([
      ["B", ["A"]],
      ["C", ["B"]],
    ]);
    const statuses: Map<string, SkillStatus> = new Map([
      ["A", "UNLOCKED"],
      ["B", "LOCKED"],
      ["C", "LOCKED"],
    ]);
    expect(findUnmetPrereq("C", prereqs, statuses)).toBe("A");
  });

  it("returns null when no unlocked prerequisite exists", () => {
    const prereqs = new Map([["B", ["A"]]]);
    const statuses: Map<string, SkillStatus> = new Map([
      ["A", "LOCKED"],
      ["B", "LOCKED"],
    ]);
    expect(findUnmetPrereq("B", prereqs, statuses)).toBeNull();
  });

  it("skips completed prerequisites", () => {
    const prereqs = new Map([
      ["B", ["A"]],
      ["C", ["B"]],
    ]);
    const statuses: Map<string, SkillStatus> = new Map([
      ["A", "COMPLETED"],
      ["B", "UNLOCKED"],
      ["C", "LOCKED"],
    ]);
    expect(findUnmetPrereq("C", prereqs, statuses)).toBe("B");
  });
});

describe("rankRecommendations", () => {
  it("recommends the next unfinished lesson of a started skill", () => {
    const state = makeState({
      lessonProgress: [{ lessonId: "L_A1", completed: true }],
    });
    const recs = rankRecommendations(state);
    expect(recs[0].type).toBe("lesson");
    expect(recs[0].id).toBe("L_A2");
    expect(recs[0].reason).toBe("Continue where you left off");
  });

  it("excludes completed lessons, solved exercises and finished projects", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "COMPLETED"],
        ["B", "UNLOCKED"],
        ["C", "LOCKED"],
      ]),
      lessonProgress: [
        { lessonId: "L_A1", completed: true },
        { lessonId: "L_A2", completed: true },
      ],
      exerciseProgress: [{ exerciseId: "E_A1", solved: true }],
      projectProgress: [{ projectId: "P_A", started: true, completed: true }],
    });
    const recs = rankRecommendations(state);
    expect(recs.some((rec) => rec.type === "lesson" && rec.id.startsWith("L_A"))).toBe(false);
    expect(recs.some((rec) => rec.id === "E_A1")).toBe(false);
    expect(recs.some((rec) => rec.id === "P_A")).toBe(false);
    expect(recs[0].context?.skillId).toBe("B");
  });

  it("never recommends locked skills or their lessons", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "UNLOCKED"],
        ["B", "LOCKED"],
        ["C", "LOCKED"],
      ]),
    });
    const recs = rankRecommendations(state);
    for (const rec of recs) {
      expect(rec.context?.skillId).not.toBe("B");
      expect(rec.context?.skillId).not.toBe("C");
    }
  });

  it("recommends the first unlocked skill for a fresh learner", () => {
    const state = makeState({ projects: [] });
    const recs = rankRecommendations(state);
    expect(recs[0].context?.skillId).toBe("A");
    expect(recs[0].reason).toBe("Next in your roadmap");
    for (const rec of recs) expect(rec.context?.skillId).toBe("A");
  });

  it("prioritizes the goal course skill as a dedicated recommendation", () => {
    const state = makeState({
      skills: [
        { id: "A", name: "Alpha", description: "First" },
        { id: "B", name: "Bravo", description: "Second" },
        { id: "C", name: "Charlie", description: "Third" },
        { id: "D", name: "Delta", description: "Fourth" },
      ],
      skillPrereqs: new Map([
        ["B", ["A"]],
        ["C", ["A"]],
        ["D", ["C"]],
      ]),
      statuses: new Map([
        ["A", "COMPLETED"],
        ["B", "UNLOCKED"],
        ["C", "UNLOCKED"],
        ["D", "LOCKED"],
      ]),
      lessons: [
        { id: "L_A1", title: "Alpha One", skillId: "A" },
        { id: "L_B1", title: "Bravo One", skillId: "B" },
        { id: "L_C1", title: "Charlie One", skillId: "C" },
      ],
      goals: [{ courseId: "G1" }],
      courseSkills: new Map([["G1", ["C"]]]),
      courseNames: new Map([["G1", "Goal Course"]]),
    });
    const recs = rankRecommendations(state);
    const goal = recs.find((rec) => rec.reason === "Goal: Goal Course");
    expect(goal).toBeDefined();
    expect(goal?.context?.skillId).toBe("C");
  });

  it("recommends the unlocked skill before dependent skills", () => {
    const state = makeState({ projects: [] });
    const recs = rankRecommendations(state);
    expect(recs[0].context?.skillId).toBe("A");
  });

  it("surfaces an unmet external prerequisite for a locked goal skill", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "UNLOCKED"],
        ["B", "LOCKED"],
        ["C", "LOCKED"],
      ]),
      goals: [{ courseId: "G1" }],
      courseSkills: new Map([["G1", ["C"]]]),
      courseNames: new Map([["G1", "Deep Course"]]),
    });
    const recs = rankRecommendations(state);
    const prereq = recs.find((rec) => rec.reason === "Prerequisite for Deep Course");
    expect(prereq).toBeDefined();
    expect(prereq?.type).toBe("skill");
    expect(prereq?.id).toBe("A");
  });

  it("orders same-score recommendations deterministically by title", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "COMPLETED"],
        ["B", "UNLOCKED"],
        ["C", "LOCKED"],
      ]),
      exercises: [
        { id: "E_Z", title: "Zebra", difficulty: "Easy", skillId: "B" },
        { id: "E_M", title: "Apple", difficulty: "Easy", skillId: "B" },
      ],
      projects: [],
    });
    const recs = rankRecommendations(state);
    const practice = recs.filter((rec) => rec.type === "exercise");
    expect(practice.map((rec) => rec.title)).toEqual(["Apple", "Zebra"]);
  });

  it("does not recommend a goal course once every skill is completed", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "COMPLETED"],
        ["B", "UNLOCKED"],
        ["C", "LOCKED"],
      ]),
      goals: [{ courseId: "G1" }],
      courseSkills: new Map([["G1", ["A"]]]),
      courseNames: new Map([["G1", "Finished Course"]]),
    });
    const recs = rankRecommendations(state);
    expect(recs.some((rec) => rec.reason.includes("Finished Course"))).toBe(false);
    expect(recs[0].context?.skillId).toBe("B");
  });

  it("recommends a project once its required skills are unlocked", () => {
    const state = makeState({
      lessonProgress: [{ lessonId: "L_A1", completed: true }],
    });
    const recs = rankRecommendations(state);
    const project = recs.find((rec) => rec.type === "project");
    expect(project).toBeDefined();
    expect(project?.id).toBe("P_A");
    expect(project?.reason).toBe("Build CLI Tool");
    expect(recs[0].reason).toBe("Continue where you left off");
  });

  it("recommends continuing an in-progress project above everything else", () => {
    const state = makeState({
      lessonProgress: [{ lessonId: "L_A1", completed: true }],
      projectProgress: [{ projectId: "P_A", started: true, completed: false }],
    });
    const recs = rankRecommendations(state);
    expect(recs[0].id).toBe("P_A");
    expect(recs[0].reason).toBe("Continue your project");
  });

  it("does not repeat a recommendation across tiers", () => {
    const state = makeState({
      statuses: new Map([
        ["A", "COMPLETED"],
        ["B", "UNLOCKED"],
        ["C", "LOCKED"],
      ]),
      goals: [{ courseId: "G1" }],
      courseSkills: new Map([["G1", ["B", "C"]]]),
      courseNames: new Map([["G1", "Target Course"]]),
    });
    const recs = rankRecommendations(state);
    const ids = recs.map((rec) => `${rec.type}:${rec.id}`);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns an empty list for an empty catalog", () => {
    const state = makeState({
      skills: [],
      skillPrereqs: new Map(),
      statuses: new Map(),
      lessons: [],
      exercises: [],
      projects: [],
    });
    expect(rankRecommendations(state)).toEqual([]);
  });
});
