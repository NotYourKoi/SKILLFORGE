"use client";

import { useMemo, useState } from "react";
import type { ProjectSummary } from "@/lib/projects";
import ProjectCard from "./project-card";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

/** Lightweight client-side filtering by difficulty and category. */
export default function ProjectFilters({ projects }: { projects: ProjectSummary[] }) {
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => [...new Set(projects.map((project) => project.category))].sort(),
    [projects],
  );

  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          (difficulty === "All" || project.difficulty === difficulty) &&
          (category === "All" || project.category === category),
      ),
    [projects, difficulty, category],
  );

  const selectClass =
    "border-2 border-ink bg-cream px-2 py-1 text-sm font-bold uppercase text-soot";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot/70">
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className={selectClass}
          >
            <option>All</option>
            {DIFFICULTIES.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot/70">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={selectClass}
          >
            <option>All</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs font-bold uppercase tracking-widest text-soot/50">
          {filtered.length} project{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
          No projects match those filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
