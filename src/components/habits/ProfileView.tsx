"use client";

import { motion } from "motion/react";
import { useState, useEffect, useActionState } from "react";
import { User, Moon, Sun, Bell, LogOut, Trash2, AlertTriangle } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageWithFallback } from "@/components/habits/ImageWithFallback";
import { logoutAction, deleteAccount } from "@/app/auth-actions";

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [isDark, setIsDark] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("kaisen_theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("kaisen_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    // Fermer le dialog si la suppression réussit (redirection)
    // Si pas d'erreur, la redirection va se produire
    if (state && !state.error) {
      setOpenDeleteDialog(false);
    }
  }, [state]);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-foreground mb-2">Profil</h1>
        <p className="text-muted-foreground">Gérez vos préférences</p>
      </motion.div>

      {/* Carte profil */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 mb-6 text-white shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {user.avatar ? (
              <ImageWithFallback
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-white mb-1">{user.name}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Paramètres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-6"
      >
        <h3 className="text-foreground mb-3">Préférences</h3>

        {/* Thème */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-foreground">Mode sombre</p>
                <p className="text-muted-foreground text-sm">
                  {isDark ? "Activé" : "Désactivé"}
                </p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={handleToggleTheme} />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-foreground">Notifications</p>
                <p className="text-muted-foreground text-sm">
                  Rappels pour vos habitudes
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </motion.div>

      {/* Statistiques rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h3 className="text-foreground mb-3">Votre activité</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <p className="text-2xl text-foreground mb-1">12</p>
            <p className="text-muted-foreground text-xs">Habitudes</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <p className="text-2xl text-foreground mb-1">47</p>
            <p className="text-muted-foreground text-xs">Jours actifs</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <p className="text-2xl text-foreground mb-1">89%</p>
            <p className="text-muted-foreground text-xs">Réussite</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-foreground mb-3">Actions</h3>

        <form action={logoutAction}>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4 rounded-2xl"
            type="submit"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-foreground">Se déconnecter</p>
              <p className="text-muted-foreground text-sm">
                Revenir à l&apos;écran de connexion
              </p>
            </div>
          </Button>
        </form>

        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 rounded-2xl border-destructive/30 hover:bg-destructive/10"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-destructive">Supprimer le compte</p>
                <p className="text-muted-foreground text-sm">
                  Supprimer définitivement vos données
                </p>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">
                  Supprimer votre compte
                </AlertDialogTitle>
              </div>
              <div className="space-y-3 pt-2">
                <AlertDialogDescription className="text-base">
                  Cette action est irréversible. Toutes vos données seront
                  définitivement supprimées :
                </AlertDialogDescription>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Vos habitudes et leurs logs</li>
                  <li>Vos statistiques</li>
                  <li>Vos relations sociales</li>
                  <li>Votre profil</li>
                </ul>
              </div>
            </AlertDialogHeader>
            <form action={formAction} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">
                  Confirmez avec votre mot de passe
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="rounded-xl h-12"
                  autoComplete="current-password"
                />
                {state?.error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive bg-destructive/10 rounded-xl p-3"
                  >
                    {state.error}
                  </motion.p>
                )}
              </div>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full sm:w-auto"
                  >
                    {pending ? "Suppression..." : "Supprimer définitivement"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <p className="text-muted-foreground text-sm">Kaisen v1.0.0</p>
        <p className="text-muted-foreground text-xs mt-1">
          Améliore-toi chaque jour 🌱
        </p>
      </motion.div>
    </div>
  );
}


