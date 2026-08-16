export default function CatalogLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-9 w-48 animate-pulse bg-grid" role="status" aria-label="Loading" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse border-2 border-ink bg-grid/50"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
