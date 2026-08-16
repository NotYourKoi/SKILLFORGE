export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-9 w-56 animate-pulse bg-grid" role="status" aria-label="Loading" />
      <div className="h-4 w-72 animate-pulse bg-grid/70" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse border-2 border-ink bg-grid/50"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
