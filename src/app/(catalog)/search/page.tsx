import type { Metadata } from "next";
import SearchExplorer from "@/components/search/search-explorer";
import {
  getSearchFacets,
  searchContent,
  SEARCH_TYPES,
  type SearchContentType,
} from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — SkillForge",
  description: "Search courses, skills, lessons, exercises and projects.",
};

interface SearchParams {
  q?: string;
  type?: string;
  category?: string;
  difficulty?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const type = params.type ?? "";
  const types: SearchContentType[] | undefined = (SEARCH_TYPES as string[]).includes(type)
    ? [type as SearchContentType]
    : undefined;

  const filters = {
    types,
    category: params.category,
    difficulty: params.difficulty,
    limit: 50,
  };

  const [results, facets] = await Promise.all([
    query ? searchContent(query, filters) : Promise.resolve([]),
    getSearchFacets(),
  ]);

  return (
    <SearchExplorer
      initialQuery={query}
      initialType={types?.[0] ?? ""}
      initialCategory={params.category ?? ""}
      initialDifficulty={params.difficulty ?? ""}
      results={results}
      facets={facets}
    />
  );
}
