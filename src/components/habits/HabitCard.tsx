"use client";

import { motion } from "motion/react";
import { Check, Clock, Timer } from "lucide-react";

import type { Habit } from "@/components/habits/types";

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
}

export function HabitCard({ habit, onToggle, onEdit }: HabitCardProps) {
  const isCompleted = habit.completedDates?.includes(
    new Date().toISOString().split("T")[0],
  );

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

  const borderColorClasses: Record<string, string> = {
    purple: "border-purple-500",
    pink: "border-pink-500",
    blue: "border-blue-500",
    green: "border-green-500",
    orange: "border-orange-500",
    teal: "border-teal-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
  };

  const bgGradient = colorClasses[habit.color] || colorClasses.purple;
  const borderColor = borderColorClasses[habit.color] || borderColorClasses.purple;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <div className={`bg-card/50 backdrop-blur-sm rounded-2xl p-4 shadow-sm border-2 ${borderColor} overflow-hidden relative`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-10 rounded-2xl pointer-events-none`} />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${bgGradient}`} />
              <h3 className="text-foreground truncate">{habit.name}</h3>
            </div>
            {habit.description && (
              <p className="text-muted-foreground text-sm line-clamp-1 ml-5">
                {habit.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2 ml-5">
              <span className="text-xs text-muted-foreground">
                {habit.category}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {habit.streak} jours
              </span>
              {habit.reminderTime && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {habit.reminderTime}
                    </span>
                  </div>
                </>
              )}
              {habit.duration && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {habit.duration} min
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggle(habit.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isCompleted
                  ? `bg-gradient-to-br ${bgGradient} shadow-lg`
                  : "bg-muted"
              }`}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Check className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>

        {habit.frequency && habit.frequency !== "daily" && (
          <div className="mt-3 pt-3 border-t border-border relative">
            <div className="flex gap-1">
              {["L", "M", "M", "J", "V", "S", "D"].map((_, index) => {
                const isActive = habit.activeDays?.includes(index) ?? true;
                return (
                  <div
                    key={index}
                    className={`flex-1 h-1.5 rounded-full ${
                      isActive ? `bg-gradient-to-r ${bgGradient}` : "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}



