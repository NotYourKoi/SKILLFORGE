import type { TutorContextData } from "./types";

const MAX_CONTEXT_CHARS = 4000;
const MAX_CODE_CHARS = 8000;
const MAX_LIST_ITEMS = 8;

export function sanitizeText(value: string, max: number): string {
  const collapsed = value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}\n[truncated]` : collapsed;
}

function listItems(items: string[], label: string): string {
  const clean = items.map((i) => sanitizeText(i, 300)).filter((i) => i.length > 0);
  if (clean.length === 0) return "";
  const shown = clean.slice(0, MAX_LIST_ITEMS);
  const more = clean.length > shown.length ? `\n- … and ${clean.length - shown.length} more` : "";
  return `### ${label}\n${shown.map((i) => `- ${i}`).join("\n")}${more}`;
}

/**
 * Builds a compact, sanitized text block describing where the student is.
 * Only fields that are safe to share with the model are included:
 * never solutions, hidden test cases, hints, hashes or secrets.
 */
export function buildTutorContext(data: TutorContextData): string {
  const sections: string[] = [];

  if (data.userProgress) {
    const p = data.userProgress;
    sections.push(
      [
        "### Student progress",
        `- Level ${p.level} (${p.totalXp} XP total) · ${p.currentStreak}-day streak`,
        `- Skills completed: ${p.skillsCompleted} · Lessons completed: ${p.lessonsCompleted} · Exercises solved: ${p.exercisesSolved}`,
        p.completedSkillNames.length > 0
          ? `- Known topics: ${p.completedSkillNames.slice(0, 6).join(", ")}`
          : "- Known topics: none yet",
      ].join("\n"),
    );
  }

  if (data.skill) {
    const s = data.skill;
    sections.push(
      [
        "### Current skill",
        `- Name: ${sanitizeText(s.name, 100)} (${sanitizeText(s.difficulty, 60)}, tier ${sanitizeText(s.tier, 60)})`,
        `- Description: ${sanitizeText(s.description, 500)}`,
        listItems(s.objectives, "Skill objectives"),
      ].join("\n"),
    );
  }

  if (data.lesson) {
    const l = data.lesson;
    sections.push(
      [
        "### Current lesson",
        `- Title: ${sanitizeText(l.title, 150)} (${sanitizeText(l.difficulty, 60)})`,
        `- Description: ${sanitizeText(l.description, 500)}`,
        listItems(l.objectives, "Lesson objectives"),
      ].join("\n"),
    );
  }

  if (data.exercise) {
    const e = data.exercise;
    sections.push(
      [
        "### Current exercise",
        `- Title: ${sanitizeText(e.title, 150)} (${sanitizeText(e.language, 40)}, ${sanitizeText(e.difficulty, 40)})`,
        `- Statement: ${sanitizeText(e.prompt, 800)}`,
        e.description ? `- Description: ${sanitizeText(e.description, 400)}` : "",
        listItems(e.requirements, "Requirements"),
        listItems(e.constraints, "Constraints"),
        listItems(e.examples, "Visible examples"),
      ]
        .filter((line) => line.length > 0)
        .join("\n"),
    );
  }

  if (data.quiz) {
    const q = data.quiz;
    const optionLines = q.options
      .slice(0, 6)
      .map((o) => `- ${sanitizeText(o, 200)}`)
      .join("\n");
    let marker = "";
    if (q.afterSubmit) {
      marker = [
        "### Current quiz question (AFTER submission)",
        `- Question: ${sanitizeText(q.question, 500)}`,
        `- Options:\n${optionLines}`,
        q.selectedOption ? `- Student selected: ${sanitizeText(q.selectedOption, 200)}` : "",
        q.correctOption ? `- Correct option: ${sanitizeText(q.correctOption, 200)}` : "",
        q.explanation ? `- Explanation (can now be shared): ${sanitizeText(q.explanation, 600)}` : "",
      ]
        .filter((line) => line.length > 0)
        .join("\n");
    } else {
      marker = [
        "### Current quiz question (NOT yet submitted — do NOT reveal the answer)",
        `- Question: ${sanitizeText(q.question, 500)}`,
        `- Options:\n${optionLines}`,
      ].join("\n");
    }
    sections.push(marker);
  }

  if (data.prerequisites && data.prerequisites.length > 0) {
    sections.push(
      `### Prerequisite skills\n${data.prerequisites
        .slice(0, 6)
        .map((p) => `- ${sanitizeText(p, 120)}`)
        .join("\n")}`,
    );
  }

  const joined = sections.join("\n\n");
  return joined.length > MAX_CONTEXT_CHARS
    ? `${joined.slice(0, MAX_CONTEXT_CHARS)}\n[context truncated]`
    : joined;
}

export interface SanitizedDebug {
  code: string;
  output: string;
  error: string;
}

/**
 * Sanitizes student-submitted code/output before it reaches the model.
 * Caps sizes and strips control characters. Never adds anything else.
 */
export function sanitizeDebugInput(input: {
  code?: string;
  output?: string;
  error?: string;
}): SanitizedDebug {
  return {
    code: sanitizeText(input.code ?? "", MAX_CODE_CHARS),
    output: sanitizeText(input.output ?? "", 2000),
    error: sanitizeText(input.error ?? "", 2000),
  };
}

export function formatDebugSection(debug: SanitizedDebug): string {
  const parts: string[] = [];
  if (debug.code) parts.push(`### Student's current code\n\`\`\`\n${debug.code}\n\`\`\``);
  if (debug.output) parts.push(`### Visible program output\n${debug.output}`);
  if (debug.error) parts.push(`### Error message shown to student\n${debug.error}`);
  return parts.join("\n\n");
}

export function debugSummary(debug: SanitizedDebug): string {
  const labels: string[] = [];
  if (debug.code) labels.push("code");
  if (debug.output) labels.push("output");
  if (debug.error) labels.push("error");
  return labels.length > 0 ? labels.join("+") : "none";
}
