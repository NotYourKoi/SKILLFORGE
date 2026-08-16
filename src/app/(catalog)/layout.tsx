import { auth } from "@/auth";
import SiteHeader from "@/components/site-header";
import SkipLink from "@/components/ui/skip-link";

export const dynamic = "force-dynamic";

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader
        authenticated={Boolean(session?.user)}
        username={session?.user?.username}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
      >
        {children}
      </main>
    </div>
  );
}
