"use client";

import { motion } from "motion/react";
import { useState, useEffect, useActionState } from "react";
import { User, Moon, Sun, LogOut, Trash2, AlertTriangle, Edit2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { logoutAction, deleteAccount, updateProfile } from "@/app/auth-actions";
import { uploadAvatar } from "@/app/upload-actions";

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    theme?: string;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDark, setIsDark] = useState(user.theme === "dark");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAccount, null);
  const [updateState, updateFormAction, updatePending] = useActionState(updateProfile, null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    avatar: user.avatar || "",
  });
  const [password, setPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Vérifier si l'email a changé
  const emailChanged = formData.email !== user.email;

  useEffect(() => {
    // Initialiser le thème depuis la DB ou localStorage
    const savedTheme = user.theme || window.localStorage.getItem("kaisen_theme") || "light";
    setIsDark(savedTheme === "dark");
  }, [user.theme]);

  useEffect(() => {
    // Appliquer le thème au document
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("kaisen_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    // Fermer le dialog si la suppression réussit (redirection)
    if (deleteState && !deleteState.error) {
      setOpenDeleteDialog(false);
    }
  }, [deleteState]);

  useEffect(() => {
    // Si la mise à jour réussit, recharger la page
    if (updateState?.success) {
      router.refresh();
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [updateState, router]);

  const handleToggleTheme = async (checked: boolean) => {
    setIsDark(checked);
    // Sauvegarder immédiatement le thème
    const updateFormData = new FormData();
    updateFormData.append("name", formData.name || user.name || "");
    updateFormData.append("email", formData.email || user.email || "");
    updateFormData.append("avatar", formData.avatar || user.avatar || "");
    updateFormData.append("theme", checked ? "dark" : "light");
    await updateProfile(null, updateFormData);
    router.refresh();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      avatar: user.avatar || "",
    });
    setPassword("");
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 sm:p-8 mb-6 text-white shadow-lg relative overflow-hidden"
      >
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Photo de profil */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
              ) : formData.avatar || user.avatar ? (
                <ImageWithFallback
                  src={formData.avatar || user.avatar || ""}
                  alt={formData.name || user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              )}
            </div>
            {isEditing && (
              <label
                htmlFor="avatar"
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white shadow-lg transition-all hover:scale-110 active:scale-95"
              >
                <Edit2 className="w-5 h-5 text-purple-600" />
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90 text-sm font-medium">
                    Nom <span className="text-red-200">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 rounded-xl h-11 focus:bg-white/25 focus:border-white/40 transition-all"
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                    Email <span className="text-red-200">*</span>
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 rounded-xl h-11 focus:bg-white/25 focus:border-white/40 transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
                {emailChanged && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                      Mot de passe <span className="text-red-200">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 rounded-xl h-11 focus:bg-white/25 focus:border-white/40 transition-all"
                      placeholder="Confirmez avec votre mot de passe"
                    />
                    <p className="text-white/70 text-xs">
                      Un mot de passe est requis pour changer l&apos;email
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-white text-2xl font-semibold mb-1">{user.name}</h2>
                <p className="text-white/80 text-sm">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
            {avatarFile && (
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Check className="w-4 h-4 text-green-300" />
                  <span>Nouvelle photo sélectionnée : {avatarFile.name}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setSubmitError(null);
                  
                  const submitFormData = new FormData();
                  submitFormData.append("name", formData.name);
                  submitFormData.append("email", formData.email);
                  submitFormData.append("avatar", formData.avatar || user.avatar || "");
                  
                  // Ajouter le mot de passe si l'email a changé
                  if (emailChanged) {
                    if (!password) {
                      setSubmitError("Le mot de passe est requis pour changer l'email");
                      setIsSubmitting(false);
                      return;
                    }
                    submitFormData.append("password", password);
                  }
                  
                  // Ajouter le fichier si présent
                  if (avatarFile) {
                    submitFormData.append("avatarFile", avatarFile);
                  }
                  
                  submitFormData.append("theme", isDark ? "dark" : "light");
                  
                  const result = await updateProfile(null, submitFormData);
                  setIsSubmitting(false);
                  
                  if (result?.success) {
                    // Mettre à jour formData avec le nouveau chemin d'avatar si disponible
                    if (result.avatar) {
                      setFormData((prev) => ({
                        ...prev,
                        avatar: result.avatar || prev.avatar,
                      }));
                      // Réinitialiser l'aperçu pour utiliser le vrai chemin du serveur
                      setAvatarPreview(null);
                    } else {
                      // Si pas de nouveau chemin, réinitialiser l'aperçu
                      setAvatarPreview(null);
                    }
                    
                    // Fermer le mode édition
                    setIsEditing(false);
                    
                    // Réinitialiser le fichier et le mot de passe
                    setAvatarFile(null);
                    setPassword("");
                    
                    // Recharger les données du serveur pour synchroniser
                    router.refresh();
                  } else if (result?.error) {
                    setSubmitError(result.error);
                  }
                }}
                className="flex-1"
              >
                <Button
                  type="submit"
                  size="sm"
                  className="w-full bg-white text-purple-600 hover:bg-white/90 shadow-md hover:shadow-lg transition-all font-semibold"
                  disabled={updatePending || isSubmitting}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {updatePending || isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
            </div>
            
            {(updateState?.error || submitError) && (
              <p className="text-sm text-red-200 bg-red-500/20 rounded-xl p-3 border border-red-400/30">
                {updateState?.error || submitError}
              </p>
            )}
          </div>
        )}
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
            <form action={deleteFormAction} className="space-y-4 mt-4">
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
                {deleteState?.error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive bg-destructive/10 rounded-xl p-3"
                  >
                    {deleteState.error}
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
                    disabled={deletePending}
                    className="w-full sm:w-auto"
                  >
                    {deletePending ? "Suppression..." : "Supprimer définitivement"}
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


