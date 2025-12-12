"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/habits/Logo";
import { registerAction } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Logo />
            <h1 className="text-3xl font-bold text-foreground">Kaisen</h1>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-2">Créer un compte</h2>
            <p className="text-white/80 text-sm">
              Commencez votre parcours vers de meilleures habitudes
            </p>
          </motion.div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          action={formAction}
          className="space-y-4"
        >
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                type="text"
                name="name"
                required
                placeholder="Jean Dupont"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                placeholder="vous@exemple.com"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="rounded-xl h-12"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>
            {state?.error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 rounded-xl p-3"
              >
                {state.error}
              </motion.p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-12 font-semibold shadow-md"
              aria-disabled={pending}
              disabled={pending}
            >
              {pending ? "Création..." : "Créer mon compte"}
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              className="text-purple-500 hover:text-purple-600 font-medium underline underline-offset-4"
              href="/login"
            >
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}


