import type { Metadata } from "next";
import { auth } from "@/auth";
import CourseCatalog from "@/components/course-catalog";
import { getCourses } from "@/lib/courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses — SkillForge",
  description:
    "Browse free, structured programming courses across C, Web and Python development.",
};

export default async function CoursesPage() {
  const session = await auth();
  const courses = await getCourses(session?.user?.id ?? null);

  return <CourseCatalog courses={courses} />;
}
