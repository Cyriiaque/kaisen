export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: string;
  frequency: "daily" | "weekly" | "custom";
  activeDays?: number[]; // 0-6 for Monday-Sunday
  streak: number;
  completedDates?: string[]; // ISO date strings
  createdAt: string;
  reminderTime?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

export interface UserStats {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}



