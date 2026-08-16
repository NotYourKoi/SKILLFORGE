import type {
  CourseSeed,
  ExerciseSeed,
  LessonSeed,
  ProjectSeed,
  SkillSeed,
} from "../../data/types";

/**
 * Content-architecture validation. Kept pure (no DB, no I/O) so seed data and
 * any new content added later can be checked cheaply and tested.
 */

export interface CatalogIssue {
  path: string;
  message: string;
}

export function validateCatalog(skills: SkillSeed[], courses: CourseSeed[]): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const skillIds = new Set(skills.map((s) => s.id));
  const courseIds = new Set<string>();
  const slugs = new Set<string>();

  for (const course of courses) {
    if (courseIds.has(course.id)) {
      issues.push({ path: course.id, message: `duplicate course id "${course.id}"` });
    }
    courseIds.add(course.id);

    if (slugs.has(course.slug)) {
      issues.push({ path: course.id, message: `duplicate slug "${course.slug}"` });
    }
    slugs.add(course.slug);

    const moduleIds = new Set<string>();
    const orders = new Set<number>();
    for (const mod of course.modules) {
      if (moduleIds.has(mod.id)) {
        issues.push({ path: `${course.id}/${mod.id}`, message: "duplicate module id" });
      }
      moduleIds.add(mod.id);

      if (orders.has(mod.order)) {
        issues.push({
          path: `${course.id}/${mod.id}`,
          message: `duplicate order ${mod.order}`,
        });
      }
      orders.add(mod.order);

      for (const skillId of mod.skillIds) {
        if (!skillIds.has(skillId)) {
          issues.push({
            path: `${course.id}/${mod.id}`,
            message: `unknown skill "${skillId}"`,
          });
        }
      }
    }
  }

  return issues;
}

export function validateExercises(skills: SkillSeed[], exercises: ExerciseSeed[]): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const skillIds = new Set(skills.map((s) => s.id));
  const ids = new Set<string>();

  for (const exercise of exercises) {
    if (ids.has(exercise.id)) {
      issues.push({ path: exercise.id, message: "duplicate exercise id" });
    }
    ids.add(exercise.id);

    if (!skillIds.has(exercise.skillId)) {
      issues.push({ path: exercise.id, message: `unknown skill "${exercise.skillId}"` });
    }
    if (!exercise.language.trim()) {
      issues.push({ path: exercise.id, message: "missing language" });
    }
    if (exercise.testCases.length === 0) {
      issues.push({ path: exercise.id, message: "no test cases" });
    }
    if (!exercise.testCases.some((testCase) => (testCase.isPublic ?? true) === true)) {
      issues.push({ path: exercise.id, message: "no public test cases" });
    }
    for (const testCase of exercise.testCases) {
      if (testCase.expectedOutput.trim() === "") {
        issues.push({
          path: `${exercise.id}/testCase`,
          message: "empty expectedOutput",
        });
      }
    }
  }

  return issues;
}

export function validateProjects(skills: SkillSeed[], projects: ProjectSeed[]): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const skillIds = new Set(skills.map((s) => s.id));
  const ids = new Set<string>();

  for (const project of projects) {
    if (ids.has(project.id)) {
      issues.push({ path: project.id, message: "duplicate project id" });
    }
    ids.add(project.id);

    if (!skillIds.has(project.skillId)) {
      issues.push({ path: project.id, message: `unknown skill "${project.skillId}"` });
    }
    for (const relatedId of project.relatedSkillIds) {
      if (!skillIds.has(relatedId)) {
        issues.push({
          path: `${project.id}/skill`,
          message: `unknown related skill "${relatedId}"`,
        });
      }
    }
    if (!project.relatedSkillIds.includes(project.skillId)) {
      issues.push({
        path: project.id,
        message: "primary skill must be listed in relatedSkillIds",
      });
    }
    if (!project.category.trim()) {
      issues.push({ path: project.id, message: "missing category" });
    }
    if (project.requirements.length === 0) {
      issues.push({ path: project.id, message: "no requirements" });
    }
    if (project.milestones.length === 0) {
      issues.push({ path: project.id, message: "no milestones" });
    }
    if (project.hints.length === 0) {
      issues.push({ path: project.id, message: "no hints" });
    }
  }

  return issues;
}

export function validateLessons(skills: SkillSeed[], lessons: LessonSeed[]): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const skillIds = new Set(skills.map((s) => s.id));
  const countBySkill = new Map<string, number>();
  const titlesBySkill = new Map<string, Set<string>>();

  for (const lesson of lessons) {
    const label = `${lesson.skillId}/${lesson.title}`;

    if (!skillIds.has(lesson.skillId)) {
      issues.push({ path: label, message: `unknown skill "${lesson.skillId}"` });
    }

    const order = countBySkill.get(lesson.skillId) ?? 0;
    countBySkill.set(lesson.skillId, order + 1);

    if (!lesson.title.trim()) {
      issues.push({ path: lesson.skillId, message: "missing title" });
    }
    if (!lesson.content.trim()) {
      issues.push({ path: label, message: "missing content" });
    }
    if (!lesson.description.trim()) {
      issues.push({ path: label, message: "missing description" });
    }
    if (lesson.estimatedMinutes <= 0) {
      issues.push({ path: label, message: "estimatedMinutes must be positive" });
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(lesson.difficulty)) {
      issues.push({ path: label, message: `invalid difficulty "${lesson.difficulty}"` });
    }

    const titles = titlesBySkill.get(lesson.skillId) ?? new Set<string>();
    if (titles.has(lesson.title)) {
      issues.push({ path: label, message: "duplicate title within skill" });
    }
    titles.add(lesson.title);
    titlesBySkill.set(lesson.skillId, titles);

    for (const checkpoint of lesson.checkpoints) {
      if (!checkpoint.question.trim()) {
        issues.push({ path: label, message: "checkpoint: missing question" });
      }
      if (checkpoint.options.length < 2) {
        issues.push({ path: label, message: "checkpoint: needs at least 2 options" });
      }
      if (checkpoint.correctIndex < 0 || checkpoint.correctIndex >= checkpoint.options.length) {
        issues.push({ path: label, message: "checkpoint: correctIndex out of range" });
      }
      if (new Set(checkpoint.options).size !== checkpoint.options.length) {
        issues.push({ path: label, message: "checkpoint: duplicate options" });
      }
      if (!checkpoint.explanation.trim()) {
        issues.push({ path: label, message: "checkpoint: missing explanation" });
      }
    }
  }

  return issues;
}

export function validateCatalogData(
  skills: SkillSeed[],
  courses: CourseSeed[],
  exercises: ExerciseSeed[],
  projects: ProjectSeed[],
  lessons: LessonSeed[],
): CatalogIssue[] {
  return [
    ...validateCatalog(skills, courses),
    ...validateExercises(skills, exercises),
    ...validateProjects(skills, projects),
    ...validateLessons(skills, lessons),
  ];
}
