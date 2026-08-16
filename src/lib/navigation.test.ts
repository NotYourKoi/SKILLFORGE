import { describe, expect, it } from "vitest";
import { getNavItems, isActivePath } from "@/lib/navigation";

describe("getNavItems", () => {
  it("returns only public routes for anonymous users", () => {
    const items = getNavItems({ authenticated: false });
    const hrefs = items.map((item) => item.href);
    expect(hrefs).toEqual(["/explore", "/courses", "/search"]);
  });

  it("returns the full nav for authenticated users in a stable order", () => {
    const items = getNavItems({ authenticated: true });
    const hrefs = items.map((item) => item.href);
    expect(hrefs).toEqual([
      "/dashboard",
      "/explore",
      "/courses",
      "/roadmap",
      "/projects",
      "/progress",
      "/profile",
      "/search",
    ]);
  });

  it("never returns duplicate hrefs", () => {
    for (const authenticated of [true, false]) {
      const hrefs = getNavItems({ authenticated }).map((item) => item.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });
});

describe("isActivePath", () => {
  it("matches exact paths", () => {
    expect(isActivePath("/dashboard", "/dashboard")).toBe(true);
    expect(isActivePath("/explore", "/dashboard")).toBe(false);
  });

  it("matches nested routes under the nav href", () => {
    expect(isActivePath("/course/intro-to-python", "/course")).toBe(true);
    expect(isActivePath("/course/intro-to-python", "/courses")).toBe(false);
    expect(isActivePath("/projects/abc", "/projects")).toBe(true);
  });

  it("does not match partial word boundaries", () => {
    expect(isActivePath("/course/intro-to-python", "/course")).toBe(true);
    expect(isActivePath("/coursenotreal", "/courses")).toBe(false);
  });

  it("treats the root specially", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/explore", "/")).toBe(false);
  });
});
