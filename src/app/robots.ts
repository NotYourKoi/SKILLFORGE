import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site";

/**
 * robots.txt — public routes only. Everything behind authentication
 * (dashboard, profile, roadmap, skills, lessons, quizzes, exercises,
 * projects) is explicitly disallowed so crawlers never index private content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/profile",
        "/progress",
        "/roadmap",
        "/projects",
        "/skill/",
        "/exercise/",
        "/project/",
        "/api/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
