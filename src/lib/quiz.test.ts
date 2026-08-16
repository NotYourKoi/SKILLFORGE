import { describe, expect, it } from "vitest";
import { filterValidSelectedAnswers, gradeQuiz } from "./quiz";

const correctAnswers = new Map([
  ["q1", "o1"],
  ["q2", "o2"],
  ["q3", "o3"],
  ["q4", "o4"],
]);

describe("gradeQuiz", () => {
  it("scores 100 and passes when every answer is correct", () => {
    const result = gradeQuiz(
      correctAnswers,
      { q1: "o1", q2: "o2", q3: "o3", q4: "o4" },
      70,
    );
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(4);
    expect(result.total).toBe(4);
    expect(result.passed).toBe(true);
  });

  it("scores 0 and fails when nothing matches", () => {
    const result = gradeQuiz(correctAnswers, { q1: "x", q2: "x", q3: "x", q4: "x" }, 70);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("rounds a partial score up", () => {
    const result = gradeQuiz(correctAnswers, { q1: "o1", q2: "o2", q3: "o3" }, 70);
    expect(result.score).toBe(75);
    expect(result.passed).toBe(true);
  });

  it("fails when the score is below the pass mark", () => {
    const result = gradeQuiz(correctAnswers, { q1: "o1", q2: "o2" }, 70);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });

  it("counts unanswered questions as incorrect", () => {
    const result = gradeQuiz(correctAnswers, { q1: "o1" }, 70);
    expect(result.score).toBe(25);
    expect(result.correctCount).toBe(1);
  });

  it("scores zero on an empty quiz", () => {
    const result = gradeQuiz(new Map(), {}, 70);
    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe("filterValidSelectedAnswers", () => {
  const valid = new Map([
    ["q1", new Set(["o1", "o2", "o3"])],
    ["q2", new Set(["p1", "p2"])],
  ]);

  it("keeps answers whose option belongs to their question", () => {
    const result = filterValidSelectedAnswers(valid, { q1: "o2", q2: "p1" });
    expect(result).toEqual({ q1: "o2", q2: "p1" });
  });

  it("drops options that belong to a different question", () => {
    const result = filterValidSelectedAnswers(valid, { q1: "p1", q2: "o1" });
    expect(result).toEqual({});
  });

  it("drops unknown questions and unknown option ids", () => {
    const result = filterValidSelectedAnswers(valid, {
      q1: "o1",
      q3: "o1",
      q2: "nope",
    });
    expect(result).toEqual({ q1: "o1" });
  });

  it("returns an empty object for an empty selection", () => {
    expect(filterValidSelectedAnswers(valid, {})).toEqual({});
  });
});
