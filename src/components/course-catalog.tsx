"use client";

import { useMemo, useState } from "react";
import type { CourseSummary } from "@/lib/courses";
import CourseCard from "./course-card";

export default function CourseCatalog({ courses }: { courses: CourseSummary[] }) {
  const categories = useMemo(
    () => [...new Set(courses.map((c) => c.category))].sort(),
    [courses],
  );
  const difficulties = useMemo(
    () => [...new Set(courses.map((c) => c.difficulty))].sort(),
    [courses],
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = courses.filter(
    (c) =>
      (category === "All" || c.category === category) &&
      (difficulty === "All" || c.difficulty === difficulty) &&
      (!normalizedQuery ||
        c.title.toLowerCase().includes(normalizedQuery) ||
        c.description.toLowerCase().includes(normalizedQuery)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Courses
        </h1>
        <p className="mt-1 text-sm text-soot/70">
          Structured paths built from the roadmap. Every course is free.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Search courses"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses…"
          className="min-w-0 flex-1 border-2 border-ink bg-cream px-3 py-2 text-sm text-soot outline-none focus:bg-grid"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={categories}
        />
        <FilterSelect
          label="Level"
          value={difficulty}
          onChange={setDifficulty}
          options={difficulties}
        />
        <span
          role="status"
          aria-live="polite"
          className="ml-auto text-xs font-bold uppercase tracking-widest text-soot/60"
        >
          {filtered.length} course{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-ink bg-cream p-5">
          <p className="text-sm font-bold uppercase tracking-widest text-soot">
            No courses match
          </p>
          <p className="mt-1 text-sm leading-6 text-soot/70">
            Try a different search term, or clear the category and level filters
            to see the full catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-2 border-ink bg-cream px-2 py-1 text-sm font-bold uppercase text-soot"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
