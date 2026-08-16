import { describe, expect, it } from "vitest";
import {
  buildTutorContext,
  debugSummary,
  formatDebugSection,
  sanitizeDebugInput,
  sanitizeText,
} from "./context";
import { buildSystemPrompt, buildUserPrompt, MODE_INSTRUCTIONS } from "./prompts";
import type { TutorMode } from "./types";

describe("sanitizeText", () => {
  it("trims and normalizes line endings", () => {
    expect(sanitizeText("  hi\r\nworld  ", 100)).toBe("hi\nworld");
  });

  it("strips null bytes", () => {
    expect(sanitizeText("a\u0000b", 100)).toBe("ab");
  });

  it("caps length and marks truncation", () => {
    const out = sanitizeText("a".repeat(50), 20);
    expect(out).toBe("a".repeat(20) + "\n[truncated]");
  });
});

describe("buildTutorContext", () => {
  it("builds skill, lesson and progress sections", () => {
    const context = buildTutorContext({
      skill: { id: "s1", name: "Python Basics", description: "Intro", tier: "Core", objectives: ["Write loops"], difficulty: "Beginner" },
      lesson: { title: "Loops", description: "For loops", objectives: ["Understand for loops"], difficulty: "Beginner" },
      userProgress: { level: 2, totalXp: 600, currentStreak: 3, skillsCompleted: 1, lessonsCompleted: 2, exercisesSolved: 1, completedSkillNames: ["Python Basics"] },
    });
    expect(context).toContain("Current skill");
    expect(context).toContain("Python Basics");
    expect(context).toContain("Current lesson");
    expect(context).toContain("Loops");
    expect(context).toContain("Student progress");
    expect(context).toContain("Level 2 (600 XP total)");
    expect(context).toContain("Known topics: Python Basics");
  });

  it("builds an exercise section with only safe fields", () => {
    const context = buildTutorContext({
      exercise: {
        title: "Sum numbers",
        prompt: "Write a function that sums a list",
        description: "",
        language: "python",
        difficulty: "Easy",
        requirements: ["Return an int"],
        constraints: ["No built-ins"],
        examples: ["input: [1,2]\noutput: 3"],
      },
    });
    expect(context).toContain("Current exercise");
    expect(context).toContain("Sum numbers");
    expect(context).toContain("python");
    expect(context).toContain("Return an int");
    expect(context).toContain("input: [1,2]");
  });

  it("marks quiz context as pre-submission and omits the answer", () => {
    const context = buildTutorContext({
      quiz: {
        question: "What is 2+2?",
        options: ["3", "4"],
        afterSubmit: false,
      },
    });
    expect(context).toContain("NOT yet submitted — do NOT reveal the answer");
    expect(context).not.toContain("Correct option");
    expect(context).not.toContain("selected");
  });

  it("reveals the answer explanation only after submission", () => {
    const context = buildTutorContext({
      quiz: {
        question: "What is 2+2?",
        options: ["3", "4"],
        afterSubmit: true,
        selectedOption: "3",
        correctOption: "4",
        explanation: "Because 2+2 is 4.",
      },
    });
    expect(context).toContain("AFTER submission");
    expect(context).toContain("Student selected: 3");
    expect(context).toContain("Correct option: 4");
    expect(context).toContain("Because 2+2 is 4.");
  });

  it("never emits hidden internal fields", () => {
    const context = buildTutorContext({
      skill: { id: "s", name: "X", description: "d", tier: "Core", objectives: [], difficulty: "Beginner" },
      _debug: "SHOULD NOT APPEAR",
    });
    expect(context).not.toContain("SHOULD NOT APPEAR");
  });

  it("caps oversized content within the context window", () => {
    const huge = "x".repeat(10000);
    const context = buildTutorContext({
      skill: { id: "s", name: huge, description: huge, tier: "Core", objectives: [huge], difficulty: huge },
    });
    expect(context.length).toBeLessThanOrEqual(4500);
    expect(context).not.toContain("x".repeat(4000));
  });
});

describe("sanitizeDebugInput + formatDebugSection", () => {
  it("caps student code and defaults missing fields", () => {
    const out = sanitizeDebugInput({ code: "a".repeat(20000) });
    expect(out.code.length).toBeLessThan(20000);
    expect(out.output).toBe("");
    expect(out.error).toBe("");
  });

  it("summarizes what debug info is present", () => {
    expect(debugSummary(sanitizeDebugInput({ code: "x = 1", output: "1", error: "boom" }))).toBe("code+output+error");
    expect(debugSummary(sanitizeDebugInput({}))).toBe("none");
  });

  it("builds a debug section from available parts only", () => {
    const section = formatDebugSection(sanitizeDebugInput({ code: "print(1)" }));
    expect(section).toContain("Student's current code");
    expect(section).toContain("print(1)");
    expect(section).not.toContain("Error message");
  });
});

describe("prompts", () => {
  it("builds a system prompt with role, mode instructions, guardrails and context", () => {
    const prompt = buildSystemPrompt("HINT", "### Current skill\n- Name: Loops");
    expect(prompt).toContain("SkillForge AI Tutor");
    expect(prompt).toContain("Never dump a complete solution");
    expect(prompt).toContain("Never reveal hidden test cases");
    expect(prompt).toContain("### Current skill");
    expect(prompt).toContain(MODE_INSTRUCTIONS.HINT);
    expect(prompt).toContain("Safety boundaries");
  });

  it("omits context when there is none", () => {
    const prompt = buildSystemPrompt("ASK", "");
    expect(prompt).not.toContain("## Current learning context");
  });

  it("includes the right instruction for each mode", () => {
    const modes: TutorMode[] = ["EXPLAIN", "HINT", "DEBUG", "EXPLAIN_ANSWER", "ASK"];
    for (const mode of modes) {
      const prompt = buildSystemPrompt(mode, "");
      expect(prompt).toContain(`Mode ${mode}:`);
      expect(prompt).not.toContain(`Mode ${modes.find((m) => m !== mode)}:`);
    }
  });

  it("builds a user prompt with mode and question", () => {
    expect(buildUserPrompt("DEBUG", "  why?  ")).toBe("[Student asks (mode: DEBUG)]\nwhy?");
  });

  it("keeps prompts centralized — no inline duplicates across pages", () => {
    const uniqueSections = new Set([MODE_INSTRUCTIONS.EXPLAIN, MODE_INSTRUCTIONS.HINT]);
    expect(uniqueSections.size).toBe(2);
  });
});
