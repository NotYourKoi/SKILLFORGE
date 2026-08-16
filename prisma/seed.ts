import { prisma } from "../src/lib/db";
import { skills } from "../data/skills";
import { lessons } from "../data/lessons";
import { quizzes } from "../data/quizzes";
import { courses } from "../data/courses";
import { exercises } from "../data/exercises";
import { projects } from "../data/projects";
import { achievements } from "../data/achievements";

async function main() {
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: {
        name: skill.name,
        description: skill.description,
        tier: skill.tier,
        x: skill.x,
        y: skill.y,
        objectives: JSON.stringify(skill.objectives),
        difficulty: skill.difficulty ?? "Beginner",
        estimatedMinutes: skill.estimatedMinutes ?? 30,
      },
      create: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        tier: skill.tier,
        x: skill.x,
        y: skill.y,
        objectives: JSON.stringify(skill.objectives),
        difficulty: skill.difficulty ?? "Beginner",
        estimatedMinutes: skill.estimatedMinutes ?? 30,
      },
    });
  }

  const prereqRows = skills.flatMap((skill) =>
    skill.prereqIds.map((prereqId) => ({
      skillId: skill.id,
      prereqId,
    })),
  );

  for (const row of prereqRows) {
    await prisma.prerequisite.upsert({
      where: { skillId_prereqId: row },
      update: {},
      create: row,
    });
  }

  for (const quiz of quizzes) {
    const existing = await prisma.quiz.findFirst({ where: { skillId: quiz.skillId } });
    if (existing) {
      await prisma.question.deleteMany({ where: { quizId: existing.id } });
      await prisma.quiz.delete({ where: { id: existing.id } });
    }

    await prisma.quiz.create({
      data: {
        skillId: quiz.skillId,
        title: quiz.title,
        passScore: quiz.passScore,
        questions: {
          create: quiz.questions.map((question, qi) => ({
            prompt: question.prompt,
            explanation: question.explanation,
            order: qi,
            options: {
              create: question.options.map((option, oi) => ({
                text: option.text,
                isCorrect: option.correct,
                order: oi,
              })),
            },
          })),
        },
      },
    });
  }

  // Lessons (idempotent: stable ids `${skillId}_L${n}` are upserted so user
  // progress on a lesson survives re-seeding). Remove lessons no longer in the
  // seed catalog (their LessonProgress rows cascade away).
  const orderBySkill = new Map<string, number>();
  const seededLessonIds = lessons.map((lesson) => {
    const order = orderBySkill.get(lesson.skillId) ?? 0;
    orderBySkill.set(lesson.skillId, order + 1);
    return { id: `${lesson.skillId}_L${order + 1}`, lesson, order };
  });

  await prisma.lesson.deleteMany({ where: { id: { notIn: seededLessonIds.map((l) => l.id) } } });

  for (const { id, lesson, order } of seededLessonIds) {
    await prisma.lesson.upsert({
      where: { id },
      update: {
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        difficulty: lesson.difficulty,
        content: lesson.content,
        checkpoints: JSON.stringify(lesson.checkpoints),
        order,
      },
      create: {
        id,
        skillId: lesson.skillId,
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        difficulty: lesson.difficulty,
        content: lesson.content,
        checkpoints: JSON.stringify(lesson.checkpoints),
        order,
      },
    });
  }

  // Courses → Modules → existing Skills (idempotent: modules are rebuilt from seed).
  // Remove courses no longer in the seed catalog (UserGoal.courseId is SetNull).
  const seededCourseIds = courses.map((course) => course.id);
  await prisma.course.deleteMany({ where: { id: { notIn: seededCourseIds } } });

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimatedMinutes: course.estimatedMinutes,
        objectives: JSON.stringify(course.objectives),
      },
      create: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimatedMinutes: course.estimatedMinutes,
        objectives: JSON.stringify(course.objectives),
      },
    });

    await prisma.module.deleteMany({ where: { courseId: course.id } });
    for (const mod of course.modules) {
      await prisma.module.create({
        data: {
          id: mod.id,
          courseId: course.id,
          title: mod.title,
          description: mod.description,
          order: mod.order,
          objectives: JSON.stringify(mod.objectives),
          skills: { connect: mod.skillIds.map((id) => ({ id })) },
        },
      });
    }
  }

  // Exercises (idempotent: stable ids are upserted so user attempt/progress
  // rows survive re-seeding). Remove exercises no longer in the seed catalog
  // (their ExerciseAttempt / UserExerciseProgress rows cascade away).
  const seededExerciseIds = exercises.map((exercise) => exercise.id);
  await prisma.exercise.deleteMany({ where: { id: { notIn: seededExerciseIds } } });

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: {
        skillId: exercise.skillId,
        title: exercise.title,
        prompt: exercise.prompt,
        description: exercise.description,
        requirements: JSON.stringify(exercise.requirements),
        examples: JSON.stringify(exercise.examples),
        constraints: JSON.stringify(exercise.constraints),
        language: exercise.language,
        starterCode: exercise.starterCode,
        solution: exercise.solution,
        hints: JSON.stringify(exercise.hints),
        difficulty: exercise.difficulty,
        order: exercise.order,
      },
      create: {
        id: exercise.id,
        skillId: exercise.skillId,
        title: exercise.title,
        prompt: exercise.prompt,
        description: exercise.description,
        requirements: JSON.stringify(exercise.requirements),
        examples: JSON.stringify(exercise.examples),
        constraints: JSON.stringify(exercise.constraints),
        language: exercise.language,
        starterCode: exercise.starterCode,
        solution: exercise.solution,
        hints: JSON.stringify(exercise.hints),
        difficulty: exercise.difficulty,
        order: exercise.order,
      },
    });

    await prisma.exerciseTestCase.deleteMany({ where: { exerciseId: exercise.id } });
    await prisma.exerciseTestCase.createMany({
      data: exercise.testCases.map((testCase) => ({
        exerciseId: exercise.id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        description: testCase.description,
        isPublic: testCase.isPublic ?? true,
        order: testCase.order,
      })),
    });
  }

  // Projects (idempotent: stable ids are upserted so user project progress
  // survives re-seeding). Remove projects no longer in the seed catalog (their
  // UserProject / ProjectMilestoneProgress rows cascade away).
  const seededProjectIds = projects.map((project) => project.id);
  await prisma.project.deleteMany({ where: { id: { notIn: seededProjectIds } } });

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        skillId: project.skillId,
        title: project.title,
        description: project.description,
        category: project.category,
        difficulty: project.difficulty,
        estimatedMinutes: project.estimatedMinutes,
        order: project.order,
        objectives: JSON.stringify(project.objectives),
        requirements: JSON.stringify(project.requirements),
        hints: JSON.stringify(project.hints),
        milestones: JSON.stringify(project.milestones),
        expectedOutput: project.expectedOutput,
      },
      create: {
        id: project.id,
        skillId: project.skillId,
        title: project.title,
        description: project.description,
        category: project.category,
        difficulty: project.difficulty,
        estimatedMinutes: project.estimatedMinutes,
        order: project.order,
        objectives: JSON.stringify(project.objectives),
        requirements: JSON.stringify(project.requirements),
        hints: JSON.stringify(project.hints),
        milestones: JSON.stringify(project.milestones),
        expectedOutput: project.expectedOutput,
      },
    });

    const skillIds = [...new Set([project.skillId, ...project.relatedSkillIds])];
    await prisma.projectSkill.deleteMany({ where: { projectId: project.id } });
    await prisma.projectSkill.createMany({
      data: skillIds.map((skillId) => ({ projectId: project.id, skillId })),
    });
  }

  // Achievements (idempotent: catalog definitions are mirrored into the DB so
  // UserAchievement links and display always resolve).
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        xpReward: achievement.xpReward,
      },
      create: {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        xpReward: achievement.xpReward,
      },
    });
  }

  console.log(
    `Seeded ${skills.length} skills, ${lessons.length} lessons, ${quizzes.length} quizzes, ` +
      `${courses.length} courses, ${exercises.length} exercises, ${projects.length} projects, ` +
      `${achievements.length} achievements.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
