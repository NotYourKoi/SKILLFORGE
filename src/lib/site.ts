/**
 * Public site metadata constants. `BASE_URL` is the absolute origin used by
 * robots.txt and sitemap.xml; override it in production via the BASE_URL
 * environment variable (see .env.example).
 */
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";

export const SITE_NAME = "SkillForge";
export const SITE_DESCRIPTION =
  "Free, game-style platform for learning programming — structured courses, interactive lessons, quizzes, coding exercises and real projects on a skill roadmap.";
