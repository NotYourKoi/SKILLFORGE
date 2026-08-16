"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions";
import { getNavItems, isActivePath } from "@/lib/navigation";

export default function SiteHeader({
  authenticated,
  username,
}: {
  authenticated: boolean;
  username?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  const items = getNavItems({ authenticated });

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="border-b-2 border-ink bg-teal">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link
          href={authenticated ? "/dashboard" : "/"}
          aria-label="Skill Forge home"
          className="shrink-0 border-2 border-ink bg-cream px-2 py-1 text-sm font-bold uppercase tracking-widest text-soot"
        >
          Skill Forge
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {authenticated ? (
            <span className="hidden text-sm font-bold text-soot sm:inline">@{username}</span>
          ) : null}

          {authenticated ? (
            <form action={logout} className="hidden md:block">
              <button
                type="submit"
                className="border-2 border-ink bg-danger px-3 py-1 text-sm font-bold uppercase text-soot hover:opacity-90"
              >
                Log out
              </button>
            </form>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="border-2 border-ink bg-cream px-3 py-1 text-sm font-bold uppercase text-soot hover:opacity-90"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="border-2 border-ink bg-complete px-3 py-1 text-sm font-bold uppercase text-soot hover:opacity-90"
              >
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="border-2 border-ink bg-cream px-3 py-1 text-sm font-bold uppercase text-soot md:hidden"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="site-menu" aria-label="Mobile" className="border-t-2 border-ink bg-cream md:hidden">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block px-2 py-2 text-sm font-bold uppercase ${
                    isActivePath(pathname, item.href)
                      ? "bg-teal"
                      : "text-soot hover:bg-grid"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="my-1 border-t-2 border-ink" aria-hidden="true" />
            {authenticated ? (
              <li className="px-2 py-1 text-xs font-bold uppercase text-soot/60">
                Signed in as @{username}
              </li>
            ) : (
              <li className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="border-2 border-ink bg-cream px-3 py-2 text-center text-sm font-bold uppercase text-soot"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="border-2 border-ink bg-complete px-3 py-2 text-center text-sm font-bold uppercase text-soot"
                >
                  Register
                </Link>
              </li>
            )}
            {authenticated ? (
              <li className="flex flex-col pt-1">
                <form action={logout} onClick={() => setOpen(false)}>
                  <button
                    type="submit"
                    className="w-full border-2 border-ink bg-danger px-3 py-2 text-left text-sm font-bold uppercase text-soot"
                  >
                    Log out
                  </button>
                </form>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-2 py-1 text-sm font-bold uppercase text-soot hover:bg-cream/60 ${
        active ? "bg-cream/80 underline decoration-2 underline-offset-4" : ""
      }`}
    >
      {label}
    </Link>
  );
}
