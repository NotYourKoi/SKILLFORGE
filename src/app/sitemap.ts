import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { BASE_URL } from "@/lib/site";

/**
 * sitemap.xml — public routes only. Course pages are read from the database;
 * every other listed URL is a static public page. Authenticated pages are
 * intentionally absent.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();

  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      orderBy: { slug: "asc" },
      select: { slug: true },
    });
    courseEntries = courses.map((course) => ({
      url: `${BASE_URL}/course/${course.slug}`,
      lastModified: today,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    // A sitemap must never break the build or the site: fall back to the
    // static pages if the database is unreachable.
    console.warn("[sitemap] could not load courses:", String(error));
  }

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: today,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: today,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: today,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...courseEntries,
  ];
}
