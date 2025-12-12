"use client";
import Link from "next/link";
import { Suspense, useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/habits/Logo";
import { loginAction } from "@/app/(auth)/actions";
import { CheckCircle2 } from "lucide-react";

function DeletedMessage() {
  const searchParams = useSearchParams();
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get("deleted") === "1") {
      setShowDeletedMessage(true);
      const timer = setTimeout(() => setShowDeletedMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <AnimatePresence>
      {showDeletedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Votre compte a été supprimé avec succès.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);
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
            <h2 className="text-2xl font-semibold mb-2">Connexion</h2>
            <p className="text-white/80 text-sm">
              Connectez-vous pour continuer votre parcours
            </p>
          </motion.div>
        </motion.div>

        <Suspense fallback={null}>
          <DeletedMessage />
        </Suspense>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          action={formAction}
          className="space-y-4"
        >
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-4">
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
              {pending ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              className="text-purple-500 hover:text-purple-600 font-medium underline underline-offset-4"
              href="/signup"
            >
              Créer un compte
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}


