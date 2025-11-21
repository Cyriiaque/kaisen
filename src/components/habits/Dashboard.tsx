"use client";

import { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import type { Habit } from "@/components/habits/types";
import { Input } from "@/components/ui/input";
import { toggleHabitLog } from "@/app/(app)/actions";
import { useRouter } from "next/navigation";

interface DashboardProps {
  habits: Habit[];
}

export function Dashboard({ habits }: DashboardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const handleToggleHabit = (id: string) => {
    startTransition(async () => {
      const today = new Date();
      const result = await toggleHabitLog(id, today);
      if (result?.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        toast.success("Habitude mise à jour !");
      }
    });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleCloseForm = () => {
    setShowHabitForm(false);
    setEditingHabit(undefined);
  };

  // Fonction pour vérifier si une habitude est active aujourd'hui
  const isHabitActiveToday = useMemo(() => {
    return (habit: Habit): boolean => {
      // Si l'habitude est quotidienne, elle est toujours active
      if (habit.frequency === "daily") {
        return true;
      }

      // Pour les habitudes hebdomadaires ou personnalisées, vérifier si aujourd'hui est dans activeDays
      if (habit.frequency === "weekly" || habit.frequency === "custom") {
        if (!habit.activeDays || habit.activeDays.length === 0) {
          return false;
        }

        // Obtenir le jour actuel (0 = dimanche, 1 = lundi, ..., 6 = samedi en JS)
        const todayJs = new Date().getDay();
        // Convertir vers notre système (0 = lundi, 1 = mardi, ..., 6 = dimanche)
        const todayOurSystem = todayJs === 0 ? 6 : todayJs - 1;

        return habit.activeDays.includes(todayOurSystem);
      }

      return true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.category));
    return Array.from(cats);
  }, [habits]);

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      // Filtrer d'abord par jour actif
      if (!isHabitActiveToday(habit)) {
        return false;
      }

      const matchesSearch = habit.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || habit.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [habits, searchQuery, selectedCategory, isHabitActiveToday]);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    // Filtrer seulement les habitudes actives aujourd'hui pour les stats
    const activeHabitsToday = habits.filter((h) => isHabitActiveToday(h));
    const completed = activeHabitsToday.filter((h) =>
      h.completedDates?.includes(today),
    ).length;
    const total = activeHabitsToday.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [habits, isHabitActiveToday]);

  return (
    <div className="pb-24">
      {/* Header avec stats du jour */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 mb-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm">Aujourd&apos;hui</p>
            <h2 className="text-white">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>{todayStats.percentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Progression du jour</span>
            <span className="text-white">
              {todayStats.completed}/{todayStats.total}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayStats.percentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Barre de recherche */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une habitude..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-card border-border rounded-2xl h-12"
          />
        </div>
      </motion.div>

      {/* Filtres par catégorie */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Catégories</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                !selectedCategory
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Toutes
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Liste des habitudes */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggleHabit}
                onEdit={handleEditHabit}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory
                  ? "Aucune habitude trouvée"
                  : "Aucune habitude pour le moment"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formulaire d'habitude (édition uniquement) */}
      <AnimatePresence>
        {showHabitForm && (
          <HabitForm
            habit={editingHabit}
            onSave={() => {
              // Cette fonction sera gérée par HabitForm avec les actions serveur
              handleCloseForm();
              router.refresh();
            }}
            onClose={handleCloseForm}
            onDelete={editingHabit ? async () => {
              // Suppression gérée par HabitForm
              handleCloseForm();
              router.refresh();
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


