"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

import type { Habit } from "@/components/habits/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createHabit,
  updateHabit,
  deleteHabit,
} from "@/app/(app)/actions";

interface HabitFormProps {
  habit?: Habit;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

const COLORS = [
  { name: "purple", label: "Violet" },
  { name: "pink", label: "Rose" },
  { name: "blue", label: "Bleu" },
  { name: "green", label: "Vert" },
  { name: "orange", label: "Orange" },
  { name: "teal", label: "Turquoise" },
  { name: "red", label: "Rouge" },
  { name: "yellow", label: "Jaune" },
];

const CATEGORIES = [
  "Santé",
  "Productivité",
  "Bien-être",
  "Sport",
  "Apprentissage",
  "Social",
  "Créatif",
  "Autre",
];

const DAYS = [
  { short: "L", full: "Lundi" },
  { short: "M", full: "Mardi" },
  { short: "M", full: "Mercredi" },
  { short: "J", full: "Jeudi" },
  { short: "V", full: "Vendredi" },
  { short: "S", full: "Samedi" },
  { short: "D", full: "Dimanche" },
];

export function HabitForm({ habit, onSave, onClose, onDelete }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [color, setColor] = useState(habit?.color || "purple");
  const [category, setCategory] = useState(habit?.category || "Santé");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">(
    habit?.frequency || "daily",
  );
  const [activeDays, setActiveDays] = useState<number[]>(
    habit?.activeDays || [0, 1, 2, 3, 4, 5, 6],
  );

  const toggleDay = (dayIndex: number) => {
    setActiveDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort(),
    );
  };

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("name", name);
    formData.set("description", description || "");
    formData.set("color", color);
    formData.set("frequency", frequency.toUpperCase());
    formData.set(
      "activeDays",
      frequency === "daily" ? "" : JSON.stringify(activeDays),
    );

    startTransition(async () => {
      if (habit) {
        const result = await updateHabit(habit.id, null, formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Habitude mise à jour !");
          onSave();
        }
      } else {
        const result = await createHabit(null, formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Habitude créée !");
          onSave();
        }
      }
    });
  };

  const handleDelete = () => {
    if (!habit || !onDelete) return;

    startTransition(async () => {
      const result = await deleteHabit(habit.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Habitude supprimée");
        onDelete();
      }
    });
  };

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

  return (
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
            {habit ? "Modifier l'habitude" : "Nouvelle habitude"}
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
          {/* Nom */}
          <div>
            <Label htmlFor="name">Nom de l&apos;habitude *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Méditer 10 minutes"
              className="mt-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pourquoi cette habitude est importante pour vous..."
              className="mt-2 resize-none"
              rows={3}
            />
          </div>

          {/* Couleur */}
          <div>
            <Label>Couleur</Label>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {COLORS.map((c) => (
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
                      color === c.name ? "ring-2 ring-offset-2 ring-foreground" : ""
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

          {/* Catégorie */}
          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fréquence */}
          <div>
            <Label>Fréquence</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFrequency("daily")}
                className={`py-3 rounded-xl transition-all ${
                  frequency === "daily"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Quotidien
              </button>
              <button
                type="button"
                onClick={() => setFrequency("weekly")}
                className={`py-3 rounded-xl transition-all ${
                  frequency === "weekly"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Hebdo
              </button>
              <button
                type="button"
                onClick={() => setFrequency("custom")}
                className={`py-3 rounded-xl transition-all ${
                  frequency === "custom"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Perso
              </button>
            </div>
          </div>

          {/* Jours actifs */}
          {frequency !== "daily" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <Label>Jours actifs</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {DAYS.map((day, index) => {
                  const isActive = activeDays.includes(index);
                  return (
                    <button
                      key={day.full}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                      title={day.full}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {habit && onDelete ? (
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
                : habit
                ? "Enregistrer"
                : "Créer l'habitude"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


