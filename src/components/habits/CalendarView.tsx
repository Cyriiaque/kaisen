"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Habit } from "@/components/habits/types";

interface CalendarViewProps {
  habits: Habit[];
}

export function CalendarView({ habits }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    return days;
  }, [currentDate]);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const getCompletionForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const habitsToCheck = selectedHabit
      ? habits.filter((h) => h.id === selectedHabit)
      : habits;
    const completed = habitsToCheck.filter((h) =>
      h.completedDates?.includes(dateString),
    ).length;
    const total = habitsToCheck.length;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
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
    <div className="pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-foreground mb-2">Calendrier</h1>
        <p className="text-muted-foreground">Visualisez vos progrès</p>
      </motion.div>

      {/* Sélecteur d'habitude */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedHabit(null)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              !selectedHabit
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Toutes les habitudes
          </button>
          {habits.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => setSelectedHabit(habit.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedHabit === habit.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${
                  colorClasses[habit.color]
                }`}
              />
              {habit.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={previousMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-foreground font-medium">
              {currentDate.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
            <div key={`day-${index}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarData.map(({ date, isCurrentMonth }) => {
            const { completed, total, percentage } = getCompletionForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();

            let bgClass = "bg-muted";
            if (percentage > 0 && percentage < 50) {
              bgClass = "bg-gradient-to-br from-purple-400 to-purple-600";
            } else if (percentage >= 50 && percentage < 100) {
              bgClass = "bg-gradient-to-br from-pink-400 to-pink-600";
            } else if (percentage === 100) {
              bgClass = "bg-gradient-to-br from-green-400 to-green-600";
            }

            return (
              <div
                key={date.toISOString()}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs ${
                  isCurrentMonth ? "" : "opacity-30"
                }`}
              >
                <div
                  className={`w-full h-full rounded-xl flex flex-col items-center justify-center ${
                    percentage > 0 ? bgClass : "bg-muted"
                  } ${isToday ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                >
                  <span
                    className={`text-sm ${
                      percentage > 0 ? "text-white" : "text-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {total > 0 && (
                    <span
                      className={`text-[10px] ${
                        percentage > 0 ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      {completed}/{total}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}


