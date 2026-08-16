import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./validation";

describe("registerSchema", () => {
  it("accepts valid credentials", () => {
    const result = registerSchema.safeParse({
      username: "alice_1",
      email: "alice@example.com",
      password: "correct-horse-battery",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a username that is too short", () => {
    const result = registerSchema.safeParse({
      username: "ab",
      email: "alice@example.com",
      password: "correct-horse-battery",
    });
    expect(result.success).toBe(false);
  });

  it("rejects usernames with illegal characters", () => {
    const result = registerSchema.safeParse({
      username: "alice!",
      email: "alice@example.com",
      password: "correct-horse-battery",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      username: "alice",
      email: "not-an-email",
      password: "correct-horse-battery",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password that is too short", () => {
    const result = registerSchema.safeParse({
      username: "alice",
      email: "alice@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a username or email identifier", () => {
    expect(loginSchema.safeParse({ identifier: "alice", password: "pw" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "alice@example.com", password: "pw" }).success).toBe(true);
  });

  it("rejects a missing identifier or password", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "pw" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "alice", password: "" }).success).toBe(false);
  });
});
