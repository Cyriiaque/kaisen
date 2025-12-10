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
  { name: "purple", label: "Violet", gradientClass: "bg-kaisen-gradient-purple" },
  { name: "pink", label: "Rose", gradientClass: "bg-kaisen-gradient-pink" },
  { name: "blue", label: "Bleu", gradientClass: "bg-kaisen-gradient-blue" },
  { name: "green", label: "Vert", gradientClass: "bg-kaisen-gradient-green" },
  { name: "orange", label: "Orange", gradientClass: "bg-kaisen-gradient-orange" },
  { name: "teal", label: "Turquoise", gradientClass: "bg-kaisen-gradient-teal" },
  { name: "red", label: "Rouge", gradientClass: "bg-kaisen-gradient-red" },
  { name: "yellow", label: "Jaune", gradientClass: "bg-kaisen-gradient-yellow" },
];

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
        className="fixed inset-0 bg-kaisen-overlay z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
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
                      className={`w-full aspect-square rounded-xl ${
                        CATEGORY_COLORS.find((cc) => cc.name === c.name)
                          ?.gradientClass ?? "bg-kaisen-gradient-purple"
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
                className="bg-kaisen-gradient-primary text-kaisen-on-primary hover:brightness-110"
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

