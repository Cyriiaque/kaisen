export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: string;
  categoryColor?: string;
  frequency: "daily" | "weekly" | "custom";
  activeDays?: number[];
  streak: number;
  completedDates?: string[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  reminderTime?: string;
  duration?: string;
  notificationsEnabled?: boolean;
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



