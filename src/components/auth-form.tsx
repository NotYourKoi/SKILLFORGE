"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions";
import { login, register } from "@/lib/actions";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";
  const action = isLogin ? login : register;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    {},
  );

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-black uppercase tracking-tight text-soot">
        {isLogin ? "Log in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-soot/70">
        {isLogin ? "Welcome back to the forge." : "Set up your learning profile."}
      </p>

      {state.error ? (
        <p className="mt-4 border-2 border-ink bg-danger px-3 py-2 text-sm font-bold text-soot">
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        {!isLogin ? (
          <label className="flex flex-col gap-1 text-sm font-bold uppercase text-soot">
            Username
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              className="border-2 border-ink bg-cream px-3 py-2 font-normal normal-case text-soot outline-none focus:bg-grid"
            />
          </label>
        ) : null}

        {!isLogin ? (
          <label className="flex flex-col gap-1 text-sm font-bold uppercase text-soot">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="border-2 border-ink bg-cream px-3 py-2 font-normal normal-case text-soot outline-none focus:bg-grid"
            />
          </label>
        ) : null}

        {isLogin ? (
          <label className="flex flex-col gap-1 text-sm font-bold uppercase text-soot">
            Username or email
            <input
              name="identifier"
              type="text"
              autoComplete="username"
              required
              className="border-2 border-ink bg-cream px-3 py-2 font-normal normal-case text-soot outline-none focus:bg-grid"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1 text-sm font-bold uppercase text-soot">
          Password
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? 1 : 8}
            maxLength={72}
            className="border-2 border-ink bg-cream px-3 py-2 font-normal normal-case text-soot outline-none focus:bg-grid"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="mt-2 border-2 border-ink bg-complete px-6 py-3 font-bold uppercase text-soot shadow-[4px_4px_0_#1e1e1e] transition-transform enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5 enabled:hover:shadow-[2px_2px_0_#1e1e1e] disabled:opacity-60"
        >
          {pending ? "Working..." : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-sm text-soot/75">
        {isLogin ? (
          <>
            No account yet?{" "}
            <Link href="/register" className="font-bold underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
