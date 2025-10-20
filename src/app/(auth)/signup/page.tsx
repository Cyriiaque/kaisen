"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/app/auth-actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[400px] space-y-4">
        <div className="rounded-lg bg-primary text-primary-foreground p-4">
          <h1 className="text-xl font-semibold">Create account</h1>
        </div>
        <form action={formAction} className="space-y-3">
          <div className="rounded-lg bg-secondary p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="name"
                type="text"
                name="name"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" aria-disabled={pending}>
              Sign up
            </Button>
            {state?.error && (
              <p className="text-sm text-destructive mt-2">{state.error}</p>
            )}
          </div>
        </form>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link className="underline" href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}


