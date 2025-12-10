"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { toast } from "sonner";

import type { Habit } from "@/components/habits/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  purple: "bg-kaisen-gradient-purple",
  pink: "bg-kaisen-gradient-pink",
  blue: "bg-kaisen-gradient-blue",
  green: "bg-kaisen-gradient-green",
  orange: "bg-kaisen-gradient-orange",
  teal: "bg-kaisen-gradient-teal",
  red: "bg-kaisen-gradient-red",
  yellow: "bg-kaisen-gradient-yellow",
};

export function HabitForm({
  habit,
  categories = DEFAULT_CATEGORIES,
  categoryColors,
  onSave,
  onClose,
  onDelete,
}: HabitFormProps) {
  const normalizedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return DEFAULT_CATEGORIES.map(name => ({ name, color: "purple" }));
    
    if (typeof categories[0] === "string") {
      return (categories as string[]).map(name => ({
        name,
        color: categoryColors?.[name] || "purple",
      }));
    }
    
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
  const [time, setTime] = useState(habit?.reminderTime || "");
  const [duration, setDuration] = useState<number | "">(
    habit?.duration ? parseInt(habit.duration, 10) || "" : ""
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    habit?.notificationsEnabled ?? false
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

  useEffect(() => {
    if (habit) {
      setName(habit.name || "");
      setDescription(habit.description || "");
      setCategory(habit.category || normalizedCategories[0]?.name || "Autre");
      setFrequency(habit.frequency || "daily");
      setActiveDays(habit.activeDays || [0, 1, 2, 3, 4, 5, 6]);
      setTime(habit.reminderTime || "");
      setDuration(habit.duration ? parseInt(habit.duration, 10) || "" : "");
      setNotificationsEnabled(habit.notificationsEnabled ?? false);
      if (habit.startDate) {
        setStartDate(habit.startDate.split("T")[0]);
      } else if (habit.createdAt) {
        setStartDate(habit.createdAt.split("T")[0]);
      } else {
        setStartDate(new Date().toISOString().split("T")[0]);
      }
      setEndDate(habit.endDate ? habit.endDate.split("T")[0] : "");
    } else {
      setName("");
      setDescription("");
      setCategory(normalizedCategories[0]?.name || "Autre");
      setFrequency("daily");
      setActiveDays([0, 1, 2, 3, 4, 5, 6]);
      setTime("");
      setDuration("");
      setNotificationsEnabled(false);
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
    }
  }, [habit, normalizedCategories]);

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
    
    if (!name.trim()) {
      toast.error("Le nom de l'habitude est requis");
      return;
    }

    if (frequency !== "daily" && activeDays.length === 0) {
      toast.error("Au moins un jour doit être sélectionné");
      return;
    }

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
    formData.set("notificationsEnabled", notificationsEnabled ? "true" : "false");
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
        className="fixed inset-0 bg-kaisen-overlay z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
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

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir une notification pour cette habitude
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

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

          <div>
            <Label>Fréquence *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFrequency("daily")}
                className={`py-3 rounded-xl transition-all ${
                  frequency === "daily"
                    ? "bg-kaisen-gradient-primary text-kaisen-on-primary"
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
                    ? "bg-kaisen-gradient-primary text-kaisen-on-primary"
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
                    ? "bg-kaisen-gradient-primary text-kaisen-on-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Perso
              </button>
            </div>
          </div>

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
                          ? "bg-kaisen-gradient-primary text-kaisen-on-primary"
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

          <p className="text-xs text-muted-foreground">* : champ obligatoire</p>

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
              className="bg-kaisen-gradient-primary text-kaisen-on-primary hover:brightness-110"
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


