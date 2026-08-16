import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6 py-12">
        <Link
          href="/"
          className="border-2 border-ink bg-teal px-3 py-1 text-sm font-bold uppercase tracking-widest text-soot"
        >
          Skill Forge
        </Link>
        {children}
      </div>
    </main>
  );
}
