"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(app)/category-actions";

const CATEGORY_COLORS = [
  { name: "purple", label: "Violet" },
  { name: "pink", label: "Rose" },
  { name: "blue", label: "Bleu" },
  { name: "green", label: "Vert" },
  { name: "orange", label: "Orange" },
  { name: "teal", label: "Turquoise" },
  { name: "red", label: "Rouge" },
  { name: "yellow", label: "Jaune" },
];

const colorClasses: Record<string, string> = {
  purple: "from-purple-400 to-purple-600",
  pink: "from-pink-400 to-pink-600",
  blue: "from-blue-400 to-blue-600",
  green: "from-green-400 to-green-600",
  orange: "from-orange-400 to-orange-600",
  teal: "from-teal-400 to-teal-600",
  red: "from-red-400 to-red-600",
  yellow: "from-yellow-400 to-yellow-600",
};

interface CategoryFormProps {
  category?: { id: string; name: string; color: string };
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function CategoryForm({
  category,
  onSave,
  onClose,
  onDelete,
}: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "purple");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom de la catégorie est requis");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);

    startTransition(async () => {
      if (category) {
        const result = await updateCategory(category.id, null, formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Catégorie mise à jour !");
          router.refresh();
          onSave();
        }
      } else {
        const result = await createCategory(null, formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Catégorie créée !");
          router.refresh();
          onSave();
        }
      }
    });
  };

  const handleDelete = () => {
    if (!category || !onDelete) return;

    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Catégorie supprimée");
        router.refresh();
        onDelete();
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
            <h2 className="text-foreground">
              {category ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <Label htmlFor="category-name">Nom de la catégorie</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Santé, Productivité..."
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label>Couleur</Label>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className="relative"
                  >
                    <div
                      className={`w-full aspect-square rounded-xl bg-gradient-to-br ${
                        colorClasses[c.name]
                      } ${
                        color === c.name
                          ? "ring-2 ring-offset-2 ring-foreground"
                          : ""
                      }`}
                    >
                      {color === c.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {category && onDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Supprimer
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                disabled={isPending}
              >
                {isPending
                  ? "Enregistrement..."
                  : category
                  ? "Enregistrer"
                  : "Créer la catégorie"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

