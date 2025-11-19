"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Target,
  Flame,
  Award,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

import type { Habit } from "@/components/habits/types";

interface StatsViewProps {
  habits: Habit[];
}

export function StatsView({ habits }: StatsViewProps) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const completedToday = habits.filter((h) =>
      h.completedDates?.includes(today),
    ).length;
    const totalHabits = habits.length;
    const completionRate =
      totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    const currentStreak = Math.max(...habits.map((h) => h.streak), 0);
    const totalCompleted = habits.reduce(
      (sum, h) => sum + (h.completedDates?.length || 0),
      0,
    );

    // Données pour le graphique hebdomadaire
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const weeklyData = last7Days.map((date) => {
      const completed = habits.filter((h) =>
        h.completedDates?.includes(date),
      ).length;
      const dayName = [
        "Dim",
        "Lun",
        "Mar",
        "Mer",
        "Jeu",
        "Ven",
        "Sam",
      ][new Date(date).getDay()];
      return {
        day: dayName,
        completed,
        total: totalHabits,
        date,
      };
    });

    return {
      completedToday,
      totalHabits,
      completionRate,
      currentStreak,
      totalCompleted,
      weeklyData,
    };
  }, [habits]);

  const statCards = [
    {
      icon: Target,
      label: "Habitudes",
      value: stats.totalHabits,
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: TrendingUp,
      label: "Aujourd'hui",
      value: `${stats.completedToday}/${stats.totalHabits}`,
      color: "from-pink-400 to-pink-600",
    },
    {
      icon: Flame,
      label: "Série actuelle",
      value: `${stats.currentStreak} jours`,
      color: "from-orange-400 to-orange-600",
    },
    {
      icon: Award,
      label: "Total complétés",
      value: stats.totalCompleted,
      color: "from-green-400 to-green-600",
    },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-foreground mb-2">Statistiques</h1>
        <p className="text-muted-foreground">Suivez vos progrès</p>
      </motion.div>

      {/* Taux de complétion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 mb-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm">Taux de réussite</p>
            <h2 className="text-white text-4xl mt-1">
              {stats.completionRate}%
            </h2>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <CalendarIcon className="w-10 h-10" />
          </div>
        </div>
        <p className="text-white/80 text-sm">
          {stats.completedToday} sur {stats.totalHabits} habitudes complétées
          aujourd&apos;hui
        </p>
      </motion.div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className="text-foreground text-xl">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Graphique hebdomadaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6"
      >
        <h3 className="text-foreground mb-4">Derniers 7 jours</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.weeklyData}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis hide />
            <Bar dataKey="completed" radius={[8, 8, 0, 0]}>
              {stats.weeklyData.map((entry) => {
                const isToday =
                  entry.date === new Date().toISOString().split("T")[0];
                return (
                  <Cell
                    key={`cell-${entry.date}`}
                    fill={
                      isToday
                        ? "url(#gradientToday)"
                        : entry.completed > 0
                        ? "url(#gradient)"
                        : "var(--muted)"
                    }
                  />
                );
              })}
            </Bar>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                <stop offset="100%" stopColor="rgb(236, 72, 153)" />
              </linearGradient>
              <linearGradient id="gradientToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(251, 146, 60)" />
                <stop offset="100%" stopColor="rgb(234, 88, 12)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Habitudes par catégorie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <h3 className="text-foreground mb-4">Par catégorie</h3>
        <div className="space-y-3">
          {Object.entries(
            habits.reduce((acc, habit) => {
              acc[habit.category] = (acc[habit.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          ).map(([category, count], index) => {
            const colors = [
              "from-purple-400 to-purple-600",
              "from-pink-400 to-pink-600",
              "from-blue-400 to-blue-600",
              "from-green-400 to-green-600",
            ];
            return (
              <div
                key={category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                      colors[index % colors.length]
                    }`}
                  />
                  <span className="text-foreground">{category}</span>
                </div>
                <span className="text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}



