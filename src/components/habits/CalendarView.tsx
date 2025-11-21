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
    
    // getDay() retourne 0 (dimanche) à 6 (samedi)
    // On ajuste pour commencer par lundi (0 = lundi, 6 = dimanche)
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6; // Si dimanche, on met à 6

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Jours du mois précédent pour compléter la première semaine
    if (startingDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
        days.push({ date, isCurrentMonth: false });
      }
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Jours du mois suivant pour compléter la dernière semaine
    // On complète jusqu'à avoir un nombre de jours multiple de 7 (semaines complètes)
    const totalDays = days.length;
    const weeks = Math.ceil(totalDays / 7);
    const targetDays = weeks * 7;
    const remainingDays = targetDays - totalDays;
    
    if (remainingDays > 0 && remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, isCurrentMonth: false });
      }
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

  // Fonction pour vérifier si une habitude est active un jour donné
  const isHabitActiveOnDate = (habit: Habit, dateStr: string): boolean => {
    // Vérifier d'abord si l'habitude existait déjà à cette date
    const habitCreatedAt = new Date(habit.createdAt);
    habitCreatedAt.setUTCHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    checkDate.setUTCHours(0, 0, 0, 0);

    // Si l'habitude a été créée après cette date, elle n'est pas active
    if (habitCreatedAt > checkDate) {
      return false;
    }

    // Si l'habitude est quotidienne, elle est active si elle existait déjà
    if (habit.frequency === "daily") {
      return true;
    }

    // Pour les habitudes hebdomadaires ou personnalisées, vérifier si le jour est dans activeDays
    if (habit.frequency === "weekly" || habit.frequency === "custom") {
      if (!habit.activeDays || habit.activeDays.length === 0) {
        return false;
      }

      // Obtenir le jour de la date (0 = dimanche, 1 = lundi, ..., 6 = samedi en JS)
      const dateJs = new Date(dateStr).getDay();
      // Convertir vers notre système (0 = lundi, 1 = mardi, ..., 6 = dimanche)
      const dayOurSystem = dateJs === 0 ? 6 : dateJs - 1;

      return habit.activeDays.includes(dayOurSystem);
    }

    return true;
  };

  const getCompletionForDate = (date: Date) => {
    // Les dates sont stockées en UTC à minuit dans la base de données
    // On doit donc convertir la date locale en UTC pour la comparaison
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dateString = utcDate.toISOString().split("T")[0];
    
    let habitsToCheck = selectedHabit
      ? habits.filter((h) => h.id === selectedHabit)
      : habits;
    
    // Filtrer les habitudes actives ce jour-là (qui existaient déjà et sont actives)
    habitsToCheck = habitsToCheck.filter((h) =>
      isHabitActiveOnDate(h, dateString),
    );
    
    const completedHabits = habitsToCheck.filter((h) =>
      h.completedDates?.includes(dateString),
    );
    
    const completed = completedHabits.length;
    const total = habitsToCheck.length;
    
    // Toutes les habitudes actives (complétées et non complétées)
    const allActiveHabits = habitsToCheck.map((h) => ({
      id: h.id,
      color: h.color,
      name: h.name,
      isCompleted: h.completedDates?.includes(dateString) || false,
    }));
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      completedHabits: completedHabits.map((h) => ({
        id: h.id,
        color: h.color,
      })),
      allActiveHabits,
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

  const borderColorClasses: Record<string, string> = {
    purple: "border-purple-400",
    pink: "border-pink-400",
    blue: "border-blue-400",
    green: "border-green-400",
    orange: "border-orange-400",
    teal: "border-teal-400",
    red: "border-red-400",
    yellow: "border-yellow-400",
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
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarData.map(({ date, isCurrentMonth }) => {
            const { allActiveHabits } = getCompletionForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs ${
                  isCurrentMonth ? "" : "opacity-30"
                }`}
              >
                <div
                  className={`w-full h-full rounded-xl flex flex-col items-center justify-center bg-muted relative ${
                    isToday ? "ring-2 ring-offset-2 ring-foreground" : ""
                  }`}
                >
                  <span className="text-sm text-foreground mb-1">
                    {date.getDate()}
                  </span>
                  
                  {/* Pastilles de couleur pour les habitudes actives */}
                  {allActiveHabits.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center items-center max-w-full px-1">
                      {allActiveHabits.slice(0, 4).map((habit) => (
                        <div
                          key={habit.id}
                          className={`w-2 h-2 rounded-full ${
                            habit.isCompleted
                              ? `bg-gradient-to-br ${
                                  colorClasses[habit.color] || colorClasses.purple
                                }`
                              : `border-2 ${
                                  borderColorClasses[habit.color] || borderColorClasses.purple
                                } bg-transparent opacity-60`
                          }`}
                          title={habit.name}
                        />
                      ))}
                      {allActiveHabits.length > 4 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{allActiveHabits.length - 4}
                        </span>
                      )}
                    </div>
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


