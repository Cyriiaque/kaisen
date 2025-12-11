"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Habit } from "@/components/habits/types";
import { getTodayInFranceISO } from "@/lib/utils";

interface StatsViewProps {
  habits: Habit[];
}

type Period = "week" | "month" | "year";

export function StatsView({ habits }: StatsViewProps) {
  const [period, setPeriod] = useState<Period>("week");
  const today = getTodayInFranceISO();

  const stats = useMemo(() => {

    const isHabitActiveOnDate = (habit: Habit, dateStr: string): boolean => {
      const habitStart = new Date(habit.startDate || habit.createdAt);
      habitStart.setUTCHours(0, 0, 0, 0);
      const checkDate = new Date(dateStr);
      checkDate.setUTCHours(0, 0, 0, 0);

      if (habitStart > checkDate) {
        return false;
      }

      if (habit.endDate) {
        const habitEnd = new Date(habit.endDate);
        habitEnd.setUTCHours(23, 59, 59, 999);
        if (checkDate > habitEnd) {
          return false;
        }
      }

      if (habit.frequency === "daily") {
        return true;
      }

      if (habit.frequency === "weekly") {
        const todayDateObj = new Date(today);
        todayDateObj.setUTCHours(0, 0, 0, 0);

        if (checkDate > todayDateObj) {
          return false;
        }

        const weekStart = new Date(checkDate);
        const day = weekStart.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setUTCDate(weekStart.getUTCDate() + diff);
        weekStart.setUTCHours(0, 0, 0, 0);

        const hasCompletedEarlierThisWeek =
          habit.completedDates?.some((date) => {
            const completedDate = new Date(date);
            completedDate.setUTCHours(0, 0, 0, 0);
            return completedDate >= weekStart && completedDate < checkDate;
          }) ?? false;

        return !hasCompletedEarlierThisWeek;
      }

      if (habit.frequency === "custom") {
        if (!habit.activeDays || habit.activeDays.length === 0) {
          return false;
        }

        const dateJs = new Date(dateStr).getDay();
        const dayOurSystem = dateJs === 0 ? 6 : dateJs - 1;

        return habit.activeDays.includes(dayOurSystem);
      }

      return true;
    };

    const activeHabitsToday = habits.filter((h) =>
      isHabitActiveOnDate(h, today),
    );
    const completedToday = activeHabitsToday.filter((h) =>
      h.completedDates?.includes(today),
    ).length;
    const totalHabitsToday = activeHabitsToday.length;
    const totalHabits = habits.length;

    const currentStreak = Math.max(...habits.map((h) => h.streak), 0);
    const totalCompleted = habits.reduce(
      (sum, h) => sum + (h.completedDates?.length || 0),
      0,
    );

    const todayDateObj = new Date(today);
    todayDateObj.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(todayDateObj);
    
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 6);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    let totalPossible = 0;
    let totalCompletedInPeriod = 0;

    habits.forEach((habit) => {
      const habitStart = new Date(habit.startDate || habit.createdAt);
      habitStart.setUTCHours(0, 0, 0, 0);
      const periodStart = new Date(
        Math.max(habitStart.getTime(), startDate.getTime()),
      );
      
      const currentDate = new Date(periodStart);
      const habitEnd =
        habit.endDate && habit.endDate.trim() !== ""
          ? (() => {
              const d = new Date(habit.endDate as string);
              d.setUTCHours(23, 59, 59, 999);
              return d;
            })()
          : todayDateObj;

      while (currentDate <= todayDateObj && currentDate <= habitEnd) {
        const dateStr = currentDate.toISOString().split("T")[0];
        if (isHabitActiveOnDate(habit, dateStr)) {
          totalPossible++;
          if (habit.completedDates?.includes(dateStr)) {
            totalCompletedInPeriod++;
          }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });

    const completionRate =
      totalPossible > 0
        ? Math.round((totalCompletedInPeriod / totalPossible) * 100)
        : 0;

    let chartData: Array<{
      label: string;
      completed: number;
      total: number;
      date: string;
    }> = [];

    if (period === "week") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(todayDateObj);
        date.setUTCDate(date.getUTCDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      chartData = days.map((date) => {
      const activeHabitsOnDate = habits.filter((h) =>
        isHabitActiveOnDate(h, date),
      );
      const completed = activeHabitsOnDate.filter((h) =>
        h.completedDates?.includes(date),
      ).length;
      const total = activeHabitsOnDate.length;
      const dayName = [
        "Dim",
        "Lun",
        "Mar",
        "Mer",
        "Jeu",
        "Ven",
        "Sam",
      ][new Date(date).getUTCDay()];
      return {
          label: dayName,
        completed,
        total,
        date,
      };
    });
    } else if (period === "month") {
      const weeks: string[][] = [];
      const currentWeek: string[] = [];
      const todayForMonth = new Date(todayDateObj);
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(todayForMonth);
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        currentWeek.push(dateStr);
        
        if (currentWeek.length === 7 || i === 0) {
          weeks.push([...currentWeek]);
          currentWeek.length = 0;
        }
      }

      chartData = weeks.map((weekDates, weekIndex) => {
        let completed = 0;
        let total = 0;
        
        weekDates.forEach((date) => {
          const activeHabitsOnDate = habits.filter((h) =>
            isHabitActiveOnDate(h, date),
          );
          completed += activeHabitsOnDate.filter((h) =>
            h.completedDates?.includes(date),
          ).length;
          total += activeHabitsOnDate.length;
        });

        return {
          label: `S${weekIndex + 1}`,
          completed,
          total,
          date: weekDates[0],
        };
      });
    } else if (period === "year") {
      const months: Array<{ start: Date; end: Date; label: string }> = [];
      const today = new Date(todayDateObj);
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1),
        );
        const nextMonth = new Date(
          Date.UTC(
            monthDate.getUTCFullYear(),
            monthDate.getUTCMonth() + 1,
            1,
          ),
        );
        const endDate = new Date(nextMonth.getTime() - 1);
        
        months.push({
          start: monthDate,
          end: endDate,
          label: monthDate.toLocaleDateString("fr-FR", {
            month: "short",
            timeZone: "Europe/Paris",
          }),
        });
      }

      chartData = months.map((month) => {
        let completed = 0;
        let total = 0;
        
        const currentDate = new Date(month.start);
        currentDate.setUTCHours(0, 0, 0, 0);
        const isCurrentMonth = 
          month.start.getMonth() === todayDateObj.getMonth() &&
          month.start.getFullYear() === todayDateObj.getFullYear();
        const endDate = isCurrentMonth 
          ? new Date(todayDateObj)
          : new Date(month.end);
        endDate.setUTCHours(0, 0, 0, 0);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const activeHabitsOnDate = habits.filter((h) =>
            isHabitActiveOnDate(h, dateStr),
          );
          completed += activeHabitsOnDate.filter((h) =>
            h.completedDates?.includes(dateStr),
          ).length;
          total += activeHabitsOnDate.length;
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        return {
          label: month.label,
          completed,
          total,
          date: month.start.toISOString().split("T")[0],
        };
      });
    }

    return {
      completedToday,
      totalHabits,
      totalHabitsToday,
      completionRate,
      currentStreak,
      totalCompleted,
      totalCompletedInPeriod,
      totalPossible,
      chartData,
      period,
    };
  }, [habits, period]);

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
      value: `${stats.completedToday}/${stats.totalHabitsToday}`,
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-foreground mb-2">Statistiques</h1>
        <p className="text-muted-foreground">Suivez vos progrès</p>
      </motion.div>

      <Link href="/calendar">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 mb-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
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
            {stats.totalCompletedInPeriod} habitudes complétées sur {stats.totalPossible}
          </p>
        </motion.div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground">
            {period === "week"
              ? "Derniers 7 jours"
              : period === "month"
              ? "Dernier mois"
              : "Dernière année"}
          </h3>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Dernière semaine</SelectItem>
              <SelectItem value="month">Dernier mois</SelectItem>
              <SelectItem value="year">Dernière année</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          {period === "year" ? (
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, _: unknown, props: { payload?: { total?: number } }) => {
                  const total = props.payload?.total || 0;
                  return [`${value} / ${total}`, "Complétées"];
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                dot={{ fill: "rgb(168, 85, 247)", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </LineChart>
          ) : (
            <BarChart data={stats.chartData} margin={{ bottom: 10 }}>
            <XAxis
                dataKey="label"
              axisLine={false}
              tickLine={false}
                tick={(props: { x?: number; y?: number; payload?: { value?: string } }) => {
                const { x, y, payload } = props;
                  const data = stats.chartData.find(
                    (d) => d.label === payload?.value,
                  );
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={period === "week" || period === "month" ? 8 : 0}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize={12}
                    >
                        {payload?.value}
                    </text>
                      {(period === "week" || period === "month") && (
                    <text
                      x={0}
                      y={0}
                      dy={period === "week" ? 22 : 22}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize={10}
                    >
                      {data ? `${data.completed}/${data.total}` : ""}
                    </text>
                      )}
                  </g>
                );
              }}
            />
            <YAxis hide />
            <Bar dataKey="completed" radius={[8, 8, 0, 0]}>
                {stats.chartData.map((entry) => {
                const isToday =
                    period === "week" && entry.date === today;
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
          )}
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      >
        <h3 className="text-foreground mb-4">Par catégorie</h3>
        <div className="space-y-3">
          {Object.entries(
            habits.reduce((acc, habit) => {
              const categoryName = habit.category || "Autre";
              if (!acc[categoryName]) {
                acc[categoryName] = {
                  count: 0,
                  color: habit.categoryColor || "purple",
                };
              }
              acc[categoryName].count += 1;
              return acc;
            }, {} as Record<string, { count: number; color: string }>),
          )
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([category, data]) => {
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
            const colorClass = colorClasses[data.color] || colorClasses.purple;
            return (
              <div
                key={category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClass}`}
                  />
                  <span className="text-foreground">{category}</span>
                </div>
                <span className="text-muted-foreground">{data.count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}



