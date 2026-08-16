import { prisma } from "@/lib/db";

/**
 * Phase H — global search & discovery.
 *
 * Deterministic, server-side, SQLite-backed MVP search. No external search
 * service. Ranking is a pure function so it can be unit-tested without a
 * database; the DB-backed functions only assemble the small content index
 * (the catalog is far too small to need an inverted index).
 */

export type SearchContentType = "course" | "skill" | "lesson" | "exercise" | "project";

export const SEARCH_TYPES: SearchContentType[] = [
  "course",
  "skill",
  "lesson",
  "exercise",
  "project",
];

export interface SearchResult {
  type: SearchContentType;
  id: string;
  title: string;
  description: string;
  href: string;
  category?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  /** 0..100 deterministic relevance, higher = better. */
  relevance: number;
}

export interface SearchFilters {
  types?: SearchContentType[];
  category?: string;
  difficulty?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 50;

/** Lowercase, strip punctuation, collapse whitespace. Query + text both run through this. */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const EXERCISE_DIFFICULTY_GROUP: Record<string, string> = {
  Easy: "Beginner",
  Medium: "Intermediate",
  Hard: "Advanced",
};

/** Normalises difficulty labels (e.g. Easy -> Beginner) for a single filter vocabulary. */
export function difficultyGroup(difficulty: string): string {
  return EXERCISE_DIFFICULTY_GROUP[difficulty] ?? difficulty;
}

/**
 * Deterministic relevance scoring.
 *
 * Exact title match > title starts with query > title contains query >
 * description contains query > other metadata contains query. Every query
 * token must appear somewhere in the item for it to be a hit at all.
 *
 * All strings are expected to be raw; they are normalised here.
 */
export function computeRelevance(
  query: string,
  title: string,
  description: string,
  metadata: string[] = [],
): number {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;

  const normTitle = normalizeSearchText(title);
  const normDescription = normalizeSearchText(description);
  const normMetadata = metadata.map(normalizeSearchText).filter(Boolean);
  const haystack = [normTitle, normDescription, ...normMetadata].join(" ");

  if (tokens.some((token) => !haystack.includes(token))) return 0;
  if (normTitle === normalizedQuery) return 100;
  if (normTitle.startsWith(normalizedQuery)) return 80;
  if (normTitle.includes(normalizedQuery)) return 60;
  if (tokens.every((token) => normDescription.includes(token))) return 40;
  return 20;
}

interface IndexItem {
  type: SearchContentType;
  id: string;
  title: string;
  description: string;
  href: string;
  category?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  metadata: string[];
}

/** Loads the compact public content index. No solutions, hidden tests or user data. */
async function loadIndex(): Promise<IndexItem[]> {
  const [courses, skills, lessons, exercises, projects] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
      },
    }),
    prisma.skill.findMany({
      orderBy: [{ x: "asc" }, { y: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        difficulty: true,
        estimatedMinutes: true,
        tier: true,
      },
    }),
    prisma.lesson.findMany({
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        skillId: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedMinutes: true,
        skill: { select: { name: true } },
      },
    }),
    prisma.exercise.findMany({
      orderBy: [{ skillId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        skillId: true,
        title: true,
        prompt: true,
        description: true,
        difficulty: true,
        skill: { select: { name: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
      },
    }),
  ]);

  return [
    ...courses.map<IndexItem>((course) => ({
      type: "course",
      id: course.id,
      title: course.title,
      description: course.description,
      href: `/course/${course.slug}`,
      category: course.category,
      difficulty: course.difficulty,
      estimatedMinutes: course.estimatedMinutes,
      metadata: [course.category, course.difficulty],
    })),
    ...skills.map<IndexItem>((skill) => ({
      type: "skill",
      id: skill.id,
      title: skill.name,
      description: skill.description,
      href: `/skill/${skill.id}`,
      difficulty: skill.difficulty,
      estimatedMinutes: skill.estimatedMinutes,
      metadata: [skill.tier, skill.difficulty],
    })),
    ...lessons.map<IndexItem>((lesson) => ({
      type: "lesson",
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      href: `/skill/${lesson.skillId}/lesson/${lesson.id}`,
      difficulty: lesson.difficulty,
      estimatedMinutes: lesson.estimatedMinutes,
      metadata: [lesson.skill.name, lesson.difficulty],
    })),
    ...exercises.map<IndexItem>((exercise) => ({
      type: "exercise",
      id: exercise.id,
      title: exercise.title,
      description: exercise.description || exercise.prompt,
      href: `/exercise/${exercise.id}`,
      difficulty: exercise.difficulty,
      metadata: [exercise.skill.name, exercise.difficulty],
    })),
    ...projects.map<IndexItem>((project) => ({
      type: "project",
      id: project.id,
      title: project.title,
      description: project.description,
      href: `/project/${project.id}`,
      category: project.category,
      difficulty: project.difficulty,
      estimatedMinutes: project.estimatedMinutes,
      metadata: [project.category, project.difficulty],
    })),
  ];
}

function applyFilters(
  items: IndexItem[],
  query: string,
  filters: SearchFilters,
): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const types = filters.types ?? SEARCH_TYPES;
  const results: SearchResult[] = [];

  for (const item of items) {
    if (!types.includes(item.type)) continue;
    if (filters.category && item.category !== filters.category) continue;
    if (filters.difficulty && difficultyGroup(item.difficulty ?? "") !== filters.difficulty) {
      continue;
    }
    const relevance = computeRelevance(
      normalizedQuery,
      item.title,
      item.description,
      item.metadata,
    );
    if (relevance === 0) continue;
    results.push({
      type: item.type,
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      category: item.category,
      difficulty: item.difficulty,
      estimatedMinutes: item.estimatedMinutes,
      relevance,
    });
  }

  // Deterministic ordering: relevance desc, then title, then id.
  results.sort(
    (a, b) =>
      b.relevance - a.relevance ||
      a.title.localeCompare(b.title) ||
      a.id.localeCompare(b.id),
  );

  const limit = filters.limit ?? DEFAULT_LIMIT;
  return results.slice(0, Math.max(0, limit));
}

/** Searches every content type. Returns [] for an empty query. */
export async function searchContent(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  const items = await loadIndex();
  return applyFilters(items, query, filters);
}

export async function searchCourses(query: string, filters: Omit<SearchFilters, "types"> = {}): Promise<SearchResult[]> {
  return searchContent(query, { ...filters, types: ["course"] });
}

export async function searchSkills(query: string, filters: Omit<SearchFilters, "types"> = {}): Promise<SearchResult[]> {
  return searchContent(query, { ...filters, types: ["skill"] });
}

export async function searchLessons(query: string, filters: Omit<SearchFilters, "types"> = {}): Promise<SearchResult[]> {
  return searchContent(query, { ...filters, types: ["lesson"] });
}

export async function searchExercises(query: string, filters: Omit<SearchFilters, "types"> = {}): Promise<SearchResult[]> {
  return searchContent(query, { ...filters, types: ["exercise"] });
}

export async function searchProjects(query: string, filters: Omit<SearchFilters, "types"> = {}): Promise<SearchResult[]> {
  return searchContent(query, { ...filters, types: ["project"] });
}

const STANDARD_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

/**
 * Dynamic filter facets derived from the database (never hardcoded), so new
 * categories in the seed data show up automatically.
 */
export async function getSearchFacets(): Promise<{ categories: string[]; difficulties: string[] }> {
  const [courses, projects, skills, lessons, exercises] = await Promise.all([
    prisma.course.findMany({ select: { category: true, difficulty: true } }),
    prisma.project.findMany({ select: { category: true } }),
    prisma.skill.findMany({ select: { difficulty: true } }),
    prisma.lesson.findMany({ select: { difficulty: true } }),
    prisma.exercise.findMany({ select: { difficulty: true } }),
  ]);

  const categories = [
    ...new Set([...courses.map((c) => c.category), ...projects.map((p) => p.category)]),
  ].sort((a, b) => a.localeCompare(b));

  const seen = new Set<string>();
  for (const row of [...courses, ...skills, ...lessons, ...exercises]) {
    seen.add(difficultyGroup(row.difficulty));
  }
  const difficulties = STANDARD_DIFFICULTIES.filter((d) => seen.has(d));

  return { categories, difficulties };
}
