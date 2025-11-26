"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/habits/CategoryForm";
import { HabitForm } from "@/components/habits/HabitForm";
import type { Habit } from "@/components/habits/types";

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

interface HabitsManagementProps {
  categories: { id: string; name: string; color: string }[];
  habits: {
    id: string;
    name: string;
    description?: string;
    color: string;
    category: string;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    frequency?: "daily" | "weekly" | "custom";
    activeDays?: number[];
    duration?: string;
    reminderTime?: string;
  }[];
}

export function HabitsManagement({
  categories,
  habits,
}: HabitsManagementProps) {
  const router = useRouter();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    { id: string; name: string; color: string } | undefined
  >(undefined);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(
    undefined,
  );

  const categoryNames = categories.map((c) => c.name);

  const handleOpenCategoryForm = (category?: {
    id: string;
    name: string;
    color: string;
  }) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(undefined);
  };

  const handleOpenHabitForm = (habit?: Habit) => {
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleCloseHabitForm = () => {
    setShowHabitForm(false);
    setEditingHabit(undefined);
  };

  const handleCategorySave = () => {
    handleCloseCategoryForm();
    router.refresh();
  };

  const handleCategoryDelete = () => {
    handleCloseCategoryForm();
    router.refresh();
  };

  const handleHabitSave = () => {
    handleCloseHabitForm();
    router.refresh();
  };

  const handleHabitDelete = () => {
    handleCloseHabitForm();
    router.refresh();
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-foreground mb-2">Gestion des habitudes</h1>
        <p className="text-muted-foreground text-sm">
          Configurez vos catégories et gérez vos habitudes.
        </p>
      </motion.div>

      {/* Gestion des catégories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-foreground text-base">Catégories</h2>
          <span className="text-xs text-muted-foreground">
            {categories.length} catégories
          </span>
        </div>

        {/* Bouton pour créer une catégorie */}
        <Button
          type="button"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          onClick={() => handleOpenCategoryForm()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une catégorie
        </Button>

        {/* Liste des catégories existantes */}
        <div className="space-y-2 pt-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleOpenCategoryForm(category)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-br ${
                    colorClasses[category.color] || colorClasses.purple
                  }`}
                />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    {category.name}
                  </p>
                </div>
              </div>
              <Pencil className="w-4 h-4 text-white" />
            </button>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune catégorie pour le moment.
            </p>
          )}
        </div>
      </motion.div>

      {/* Gestion des habitudes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground text-base">Habitudes</h2>
          <span className="text-xs text-muted-foreground">
            {habits.length} habitudes
          </span>
        </div>

        {/* Bouton pour créer une habitude */}
        <Button
          type="button"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3"
          onClick={() => handleOpenHabitForm()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une habitude
        </Button>

        {/* Liste des habitudes */}
        <div className="space-y-2">
          {habits.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() =>
                handleOpenHabitForm({
                  id: habit.id,
                  name: habit.name,
                  description: habit.description,
                  color: habit.color,
                  category: habit.category,
                  frequency: habit.frequency || "daily",
                  activeDays: habit.activeDays,
                  streak: 0,
                  completedDates: [],
                  createdAt: habit.createdAt,
                  startDate: habit.startDate,
                  endDate: habit.endDate,
                  reminderTime: habit.reminderTime,
                  duration: habit.duration,
                })
              }
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                    colorClasses[habit.color] || colorClasses.purple
                  }`}
                />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    {habit.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {habit.category}
                  </p>
                </div>
              </div>
              <Pencil className="w-4 h-4 text-white" />
            </button>
          ))}
          {habits.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune habitude pour le moment.
            </p>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onSave={handleCategorySave}
          onClose={handleCloseCategoryForm}
          onDelete={editingCategory ? handleCategoryDelete : undefined}
        />
      )}

      {showHabitForm && (
        <HabitForm
          habit={editingHabit}
          categories={categoryNames}
          onSave={handleHabitSave}
          onClose={handleCloseHabitForm}
          onDelete={editingHabit ? handleHabitDelete : undefined}
        />
      )}
    </div>
  );
}


