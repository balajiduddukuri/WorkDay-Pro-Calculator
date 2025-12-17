export enum DayType {
  WORKDAY = 'WORKDAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

export type Theme = 'light' | 'dark' | 'neon';

export interface CalendarConfig {
  hoursPerDay: number;
  workDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  country: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface DayStat {
  date: Date;
  dayType: DayType;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
  holidayName?: string;
  note?: string;
  quote: string;
}

export interface MonthStats {
  totalDays: number;
  totalWorkingDays: number;
  remainingWorkingDays: number;
  totalHolidays: number;
  totalWeekendDays: number;
  totalWorkingHours: number;
}