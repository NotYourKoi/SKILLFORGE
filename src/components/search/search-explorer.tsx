"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMinutes } from "@/lib/format";
import type { SearchContentType, SearchResult } from "@/lib/search";

interface SearchExplorerProps {
  initialQuery: string;
  initialType: SearchContentType | "";
  initialCategory: string;
  initialDifficulty: string;
  results: SearchResult[];
  facets: { categories: string[]; difficulties: string[] };
}

const TYPE_LABELS: Record<SearchContentType, string> = {
  course: "Course",
  skill: "Skill",
  lesson: "Lesson",
  exercise: "Exercise",
  project: "Project",
};

function buildParams(
  query: string,
  type: SearchContentType | "",
  category: string,
  difficulty: string,
): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (type) params.set("type", type);
  if (category) params.set("category", category);
  if (difficulty) params.set("difficulty", difficulty);
  const serialized = params.toString();
  return serialized ? `/search?${serialized}` : "/search";
}

export default function SearchExplorer({
  initialQuery,
  initialType,
  initialCategory,
  initialDifficulty,
  results,
  facets,
}: SearchExplorerProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchContentType | "">(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState(initialDifficulty);

  const updateFilters = (
    nextQuery = query,
    nextType = type,
    nextCategory = category,
    nextDifficulty = difficulty,
  ) => {
    router.push(
      buildParams(nextQuery, nextType, nextCategory, nextDifficulty),
    );
  };

  const clearAll = () => {
    setQuery("");
    setType("");
    setCategory("");
    setDifficulty("");
    router.push("/search");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-soot">
          Search
        </h1>
        <p className="mt-1 text-sm text-soot/70">
          Find courses, skills, lessons, exercises and projects across the forge.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateFilters();
        }}
        className="flex flex-wrap items-stretch gap-3"
      >
        <input
          type="search"
          aria-label="Search the catalog"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “python basics”, “api”, “C pointers”…"
          className="min-w-0 flex-1 border-2 border-ink bg-cream px-3 py-2 text-sm text-soot outline-none focus:bg-grid"
        />
        <button
          type="submit"
          className="border-2 border-ink bg-complete px-5 py-2 text-sm font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Type"
          value={type}
          onChange={(value) => {
            setType(value as SearchContentType | "");
            updateFilters(query, value as SearchContentType | "");
          }}
          options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={(value) => {
            setCategory(value);
            updateFilters(query, type, value);
          }}
          options={facets.categories.map((value) => ({ value, label: value }))}
        />
        <FilterSelect
          label="Level"
          value={difficulty}
          onChange={(value) => {
            setDifficulty(value);
            updateFilters(query, type, category, value);
          }}
          options={facets.difficulties.map((value) => ({ value, label: value }))}
        />
        {(query || type || category || difficulty) ? (
          <button
            type="button"
            onClick={clearAll}
            className="border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase text-soot hover:bg-grid"
          >
            Clear
          </button>
        ) : null}
        <span
          role="status"
          aria-live="polite"
          className="ml-auto text-xs font-bold uppercase tracking-widest text-soot/60"
        >
          {results.length} result{results.length === 1 ? "" : "s"}
        </span>
      </div>

      {!query.trim() ? (
        <div className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
          Type a query above to search the whole catalog, or use the filters to
          narrow results. Every result is ranked deterministically — exact title
          matches first, then title, then description.
        </div>
      ) : results.length === 0 ? (
        <div className="border-2 border-ink bg-cream p-5 text-sm text-soot/70">
          No matches for “{query}” with the current filters. Try fewer words or
          clear the filters.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((result) => (
            <li key={`${result.type}:${result.id}`}>
              <Link
                href={result.href}
                className="flex flex-col gap-2 border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1e1e1e]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-2 border-ink bg-teal px-2 py-0.5 text-xs font-bold uppercase text-soot">
                    {TYPE_LABELS[result.type]}
                  </span>
                  {result.category ? (
                    <span className="border-2 border-ink bg-grid px-2 py-0.5 text-xs font-bold uppercase text-soot">
                      {result.category}
                    </span>
                  ) : null}
                  {result.difficulty ? (
                    <span className="border-2 border-ink bg-unlocked px-2 py-0.5 text-xs font-bold uppercase text-soot">
                      {result.difficulty}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-lg font-black uppercase leading-tight tracking-tight text-soot">
                  {result.title}
                </h2>
                <p className="text-sm leading-6 text-soot/75">{result.description}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-soot/60">
                  {result.estimatedMinutes
                    ? `${formatMinutes(result.estimatedMinutes)} · `
                    : ""}
                  Match {result.relevance}%
                </p>
              </Link>
            </li>
          ))}
        </ul>
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
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-soot">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-2 border-ink bg-cream px-2 py-1 text-sm font-bold uppercase text-soot"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
