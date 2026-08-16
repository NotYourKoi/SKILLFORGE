import { describe, expect, it } from "vitest";
import {
  cascadeUncomplete,
  deriveStatus,
  deriveStatuses,
  toggleCompletion,
  type SkillGraphNode,
} from "./roadmap";

const nodes: SkillGraphNode[] = [
  { id: "A", prereqIds: [] },
  { id: "B", prereqIds: ["A"] },
  { id: "C", prereqIds: ["B"] },
  { id: "D", prereqIds: ["A"] },
];

describe("deriveStatus", () => {
  it("returns COMPLETED when the skill is in the completed set", () => {
    expect(deriveStatus({ id: "B", prereqIds: ["A"] }, new Set(["B"]))).toBe("COMPLETED");
  });

  it("returns UNLOCKED when all prereqs are completed", () => {
    expect(deriveStatus({ id: "B", prereqIds: ["A"] }, new Set(["A"]))).toBe("UNLOCKED");
  });

  it("returns LOCKED when a prereq is missing", () => {
    expect(deriveStatus({ id: "B", prereqIds: ["A"] }, new Set())).toBe("LOCKED");
  });

  it("returns UNLOCKED for a root skill with no prereqs", () => {
    expect(deriveStatus({ id: "A", prereqIds: [] }, new Set())).toBe("UNLOCKED");
  });
});

describe("deriveStatuses", () => {
  it("derives a status for every node from the completed set", () => {
    const statuses = deriveStatuses(nodes, new Set(["A", "B"]));
    expect(statuses.get("A")).toBe("COMPLETED");
    expect(statuses.get("B")).toBe("COMPLETED");
    expect(statuses.get("C")).toBe("UNLOCKED");
    expect(statuses.get("D")).toBe("UNLOCKED");
  });
});

describe("toggleCompletion", () => {
  it("completes an unlocked skill", () => {
    const result = toggleCompletion(nodes, new Set(["A"]), "B");
    expect(result).not.toBeNull();
    expect(result!.has("B")).toBe(true);
    expect(result!.has("A")).toBe(true);
  });

  it("returns null when trying to complete a locked skill", () => {
    expect(toggleCompletion(nodes, new Set(), "B")).toBeNull();
  });

  it("returns null for an unknown skill", () => {
    expect(toggleCompletion(nodes, new Set(["A"]), "ZZZ")).toBeNull();
  });

  it("uncompleting a leaf only removes that node", () => {
    const result = toggleCompletion(nodes, new Set(["A", "B"]), "B");
    expect(result).not.toBeNull();
    expect(result!.has("A")).toBe(true);
    expect(result!.has("B")).toBe(false);
  });

  it("uncompleting an ancestor cascades through the chain", () => {
    const result = toggleCompletion(nodes, new Set(["A", "B", "C", "D"]), "A");
    expect(result).not.toBeNull();
    for (const id of ["A", "B", "C", "D"]) {
      expect(result!.has(id)).toBe(false);
    }
  });
});

describe("cascadeUncomplete", () => {
  it("depth-first uncompletes every completed dependent", () => {
    const result = cascadeUncomplete(nodes, new Set(["A", "B", "C"]), "A");
    expect(result.has("A")).toBe(false);
    expect(result.has("B")).toBe(false);
    expect(result.has("C")).toBe(false);
  });

  it("leaves unrelated completed skills intact", () => {
    const result = cascadeUncomplete(nodes, new Set(["A", "B", "C", "D"]), "B");
    expect(result.has("A")).toBe(true);
    expect(result.has("B")).toBe(false);
    expect(result.has("C")).toBe(false);
    expect(result.has("D")).toBe(true);
  });

  it("does not remove skills that are not completed", () => {
    const result = cascadeUncomplete(nodes, new Set(["A"]), "A");
    expect(result.has("A")).toBe(false);
    expect(result.size).toBe(0);
  });
});
