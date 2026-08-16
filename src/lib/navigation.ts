export interface NavItem {
  href: string;
  label: string;
}

const ALL_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore" },
  { href: "/courses", label: "Courses" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/projects", label: "Projects" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
  { href: "/search", label: "Search" },
];

const AUTHED_ONLY = new Set(["/dashboard", "/roadmap", "/projects", "/progress", "/profile"]);

/** Global nav items. Anonymous users only see public, unguarded routes. */
export function getNavItems({ authenticated }: { authenticated: boolean }): NavItem[] {
  return authenticated ? ALL_ITEMS : ALL_ITEMS.filter((item) => !AUTHED_ONLY.has(item.href));
}

/**
 * Active-route matching: exact equality or a prefix boundary (`/course/x` is
 * active for `/course`). The root is only active on the root itself.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
