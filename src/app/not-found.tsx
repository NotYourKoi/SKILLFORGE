import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-black text-soot">404</p>
      <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
        That page does not exist
      </h1>
      <p className="max-w-md text-sm leading-6 text-soot/70">
        The link may be broken, or the page may have moved. You can head back to
        the home page or search the catalog instead.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="border-2 border-ink bg-complete px-5 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
        >
          Go home
        </Link>
        <Link
          href="/search"
          className="border-2 border-ink bg-cream px-5 py-2 font-bold uppercase text-soot shadow-[3px_3px_0_#1e1e1e] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1e1e1e]"
        >
          Search
        </Link>
      </div>
    </main>
  );
}
