export type SkillStatus = "LOCKED" | "UNLOCKED" | "COMPLETED";

export interface SkillGraphNode {
  id: string;
  prereqIds: string[];
}

/** Mirrors SkillTree.recomputeStatuses: COMPLETED > UNLOCKED > LOCKED. */
export function deriveStatus(node: SkillGraphNode, completed: Set<string>): SkillStatus {
  if (completed.has(node.id)) return "COMPLETED";
  const prereqsMet = node.prereqIds.every((prereqId) => completed.has(prereqId));
  return prereqsMet ? "UNLOCKED" : "LOCKED";
}

export function deriveStatuses(
  nodes: SkillGraphNode[],
  completed: Set<string>,
): Map<string, SkillStatus> {
  const statuses = new Map<string, SkillStatus>();
  for (const node of nodes) {
    statuses.set(node.id, deriveStatus(node, completed));
  }
  return statuses;
}

/**
 * Mirrors SkillTree.cascadeUncomplete: un-completes the given skill, then
 * depth-first un-completes any completed dependent, so no completed node
 * ever hangs off a locked one.
 */
export function cascadeUncomplete(
  nodes: SkillGraphNode[],
  completed: Set<string>,
  startId: string,
): Set<string> {
  const dependentsOf = new Map<string, string[]>();
  for (const node of nodes) {
    for (const prereqId of node.prereqIds) {
      const list = dependentsOf.get(prereqId) ?? [];
      list.push(node.id);
      dependentsOf.set(prereqId, list);
    }
  }

  const result = new Set(completed);
  result.delete(startId);

  const stack = [startId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    for (const dependent of dependentsOf.get(id) ?? []) {
      if (result.has(dependent)) {
        result.delete(dependent);
        stack.push(dependent);
      }
    }
  }

  return result;
}

/** Mirrors SkillTree.toggle. Returns the new completed set, or null if locked. */
export function toggleCompletion(
  nodes: SkillGraphNode[],
  completed: Set<string>,
  skillId: string,
): Set<string> | null {
  const node = nodes.find((n) => n.id === skillId);
  if (!node) return null;

  if (completed.has(skillId)) {
    return cascadeUncomplete(nodes, completed, skillId);
  }

  if (deriveStatus(node, completed) === "LOCKED") return null;

  const result = new Set(completed);
  result.add(skillId);
  return result;
}
