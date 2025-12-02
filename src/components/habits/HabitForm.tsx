"use client";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
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
  categories?: string[] | { name: string; color: string }[];
  categoryColors?: Record<string, string>;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

const DEFAULT_CATEGORIES = [
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

export function HabitForm({
  habit,
  categories = DEFAULT_CATEGORIES,
  categoryColors,
  onSave,
  onClose,
  onDelete,
}: HabitFormProps) {
  // Normaliser les catégories pour avoir un format uniforme
  const normalizedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return DEFAULT_CATEGORIES.map(name => ({ name, color: "purple" }));
    
    if (typeof categories[0] === "string") {
      // Si c'est un tableau de strings, créer des objets avec couleur par défaut
      return (categories as string[]).map(name => ({
        name,
        color: categoryColors?.[name] || "purple",
      }));
    }
    
    // Si c'est déjà un tableau d'objets
    return categories as { name: string; color: string }[];
  }, [categories, categoryColors]);
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [category, setCategory] = useState(
    habit?.category || normalizedCategories[0]?.name || "Autre",
  );
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">(
    habit?.frequency || "daily",
  );
  const [activeDays, setActiveDays] = useState<number[]>(
    habit?.activeDays || [0, 1, 2, 3, 4, 5, 6],
  );
  // Pour l'heure, on récupère depuis reminderTime si disponible
  const [time, setTime] = useState(habit?.reminderTime || "");
  // Pour la durée, on récupère depuis l'habitude si disponible (en minutes)
  // On parse la valeur si elle existe (car stockée comme string en base)
  const [duration, setDuration] = useState<number | "">(
    habit?.duration ? parseInt(habit.duration, 10) || "" : ""
  );
  const [startDate, setStartDate] = useState(() => {
    if (habit?.startDate) {
      return habit.startDate.split("T")[0];
    }
    if (habit?.createdAt) {
      return habit.createdAt.split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return habit?.endDate ? habit.endDate.split("T")[0] : "";
  });

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
    
    // Validation côté client
    if (!name.trim()) {
      toast.error("Le nom de l'habitude est requis");
      return;
    }

    if (frequency !== "daily" && activeDays.length === 0) {
      toast.error("Au moins un jour doit être sélectionné");
      return;
    }

    // Validation des dates : la date de début ne peut pas être supérieure à la date de fin
    if (startDate && endDate && startDate > endDate) {
      toast.error("La date de début ne peut pas être supérieure à la date de fin");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("name", name);
    formData.set("description", description || "");
    formData.set("frequency", frequency.toUpperCase());
    formData.set("categoryName", category || "");
    formData.set(
      "activeDays",
      frequency === "daily" ? "" : JSON.stringify(activeDays),
    );
    formData.set("time", time || "");
    formData.set("duration", duration !== "" ? duration.toString() : "");
    formData.set("startDate", startDate || "");
    formData.set("endDate", endDate || "");

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
        className="bg-background w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-hidden"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 dark:hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/60">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description..."
              className="mt-2 resize-none"
              rows={3}
            />
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue>
                  {(() => {
                    const selectedCat = normalizedCategories.find(
                      (c) => c.name === category,
                    );
                    return selectedCat ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                            colorClasses[selectedCat.color] ||
                            colorClasses.purple
                          }`}
                        />
                        <span>{selectedCat.name}</span>
                      </div>
                    ) : (
                      category
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[110]" position="popper">
                {normalizedCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                          colorClasses[cat.color] || colorClasses.purple
                        }`}
                      />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Heure */}
          <div>
            <Label htmlFor="time">Heure</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-time-picker-indicator]:invert"
            />
          </div>

          {/* Durée */}
          <div>
            <Label htmlFor="duration">Durée</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="duration"
                type="number"
                min="0"
                step="1"
                value={duration === "" ? "" : duration}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setDuration("");
                  } else {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 0) {
                      setDuration(num);
                    }
                  }
                }}
                placeholder="Ex: 10"
                className="flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                minutes
              </span>
            </div>
          </div>

          {/* Période */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                className="mt-2 dark:[&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="mt-2 dark:[&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>

          {/* Fréquence */}
          <div>
            <Label>Fréquence *</Label>
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

          {/* Jours actifs (uniquement pour les fréquences personnalisées) */}
          {frequency === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <Label>Jours actifs *</Label>
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

          {/* Mention champs obligatoires */}
          <p className="text-xs text-muted-foreground">* : champ obligatoire</p>

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
    </AnimatePresence>
  );
}


