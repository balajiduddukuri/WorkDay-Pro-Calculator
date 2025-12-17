import { DayType, DayStat, CalendarConfig, Holiday, MonthStats } from "../types";

const LEADERSHIP_QUOTES = [
  "A leader is one who knows the way, goes the way, and shows the way. - John C. Maxwell",
  "Leadership is the capacity to translate vision into reality. - Warren Bennis",
  "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others. - Jack Welch",
  "The function of leadership is to produce more leaders, not more followers. - Ralph Nader",
  "Leadership and learning are indispensable to each other. - John F. Kennedy",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Do not follow where the path may lead. Go instead where there is no path and leave a trail. - Ralph Waldo Emerson",
  "A good leader takes a little more than his share of the blame, a little less than his share of the credit. - Arnold H. Glasow",
  "The art of leadership is saying no, not saying yes. It is very easy to say yes. - Tony Blair",
  "Great leaders are not defined by the absence of weakness, but rather by the presence of clear strengths. - John Zenger",
  "He who has never learned to obey cannot be a good commander. - Aristotle",
  "I suppose leadership at one time meant muscles; but today it means getting along with people. - Mahatma Gandhi",
  "Leadership is unlocking people's potential to become better. - Bill Bradley",
  "Become the kind of leader that people would follow voluntarily; even if you had no title or position. - Brian Tracy",
  "Leadership is not a position or a title, it is action and example. - Cory Booker",
  "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things. - Ronald Reagan",
  "To handle yourself, use your head; to handle others, use your heart. - Eleanor Roosevelt",
  "Leadership is the art of giving people a platform for spreading ideas that work. - Seth Godin",
  "A true leader has the confidence to stand alone, the courage to make tough decisions, and the compassion to listen to the needs of others. - Douglas MacArthur",
  "The challenge of leadership is to be strong, but not rude; be kind, but not weak; be bold, but not bully; be thoughtful, but not lazy; be humble, but not timid. - Jim Rohn",
  "Management is doing things right; leadership is doing the right things. - Peter Drucker",
  "Don't find fault, find a remedy. - Henry Ford",
  "Leaders think and talk about the solutions. Followers think and talk about the problems. - Brian Tracy",
  "A leader is a dealer in hope. - Napoleon Bonaparte",
  "You don't lead by pointing and telling people some place to go. You lead by going to that place and making a case. - Ken Kesey",
  "If your actions inspire others to dream more, learn more, do more and become more, you are a leader. - John Quincy Adams",
  "Earn your leadership every day. - Michael Jordan",
  "Leadership is the ability to guide others without force into a direction or decision that leaves them still feeling empowered and accomplished. - Lisa Cash Hanson",
  "Effective leadership is not about making speeches or being liked; leadership is defined by results not attributes. - Peter Drucker",
  "Anyone can hold the helm when the sea is calm. - Publilius Syrus",
  "A leader takes people where they want to go. A great leader takes people where they don't necessarily want to go, but ought to be. - Rosalynn Carter"
];

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const generateCalendarGrid = (
  year: number,
  month: number,
  config: CalendarConfig,
  customHolidays: Record<string, string>,
  notes: Record<string, string>
): DayStat[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  
  // Adjusted for Monday start: Mon(1) -> 0 offset, Sun(0) -> 6 offset
  const dayOfWeek = firstDayOfMonth.getDay();
  const startOffset = (dayOfWeek + 6) % 7; 
  
  const daysInMonth = getDaysInMonth(year, month);
  const grid: DayStat[] = [];

  // Previous month padding
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    grid.push(calculateDayStat(d, config, customHolidays, notes, false));
  }

  // Current month
  daysInMonth.forEach((d) => {
    grid.push(calculateDayStat(d, config, customHolidays, notes, true));
  });

  // Next month padding to fill 6 weeks (42 days) to ensure consistent height
  const remainingSlots = 42 - grid.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const d = new Date(year, month + 1, i);
    grid.push(calculateDayStat(d, config, customHolidays, notes, false));
  }

  return grid;
};

const calculateDayStat = (
  date: Date,
  config: CalendarConfig,
  customHolidays: Record<string, string>,
  notes: Record<string, string>,
  isCurrentMonth: boolean
): DayStat => {
  const dayOfWeek = date.getDay();
  const dateKey = formatDateKey(date);
  const todayKey = formatDateKey(new Date());

  let dayType: DayType;
  let holidayName: string | undefined = customHolidays[dateKey];
  let note: string | undefined = notes[dateKey];

  if (holidayName) {
    dayType = DayType.HOLIDAY;
  } else if (!config.workDays.includes(dayOfWeek)) {
    dayType = DayType.WEEKEND;
  } else {
    dayType = DayType.WORKDAY;
  }

  // Calculate First and Last day of the month
  const isFirstDay = isCurrentMonth && date.getDate() === 1;
  // Last day calculation: Get 0th day of next month
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const isLastDay = isCurrentMonth && date.getDate() === daysInMonth;

  // Deterministic quote based on date
  const quoteIndex = (date.getFullYear() * 1000 + date.getMonth() * 50 + date.getDate()) % LEADERSHIP_QUOTES.length;
  const quote = LEADERSHIP_QUOTES[quoteIndex];

  return {
    date,
    dayType,
    isCurrentMonth,
    isToday: dateKey === todayKey,
    isFirstDay,
    isLastDay,
    holidayName,
    note,
    quote
  };
};

export const calculateMonthStats = (grid: DayStat[], config: CalendarConfig): MonthStats => {
  // Only calculate for days belonging to the current selected month
  const currentMonthDays = grid.filter((d) => d.isCurrentMonth);
  
  // Calculate today at midnight for accurate comparison
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalDays = currentMonthDays.length;
  const totalHolidays = currentMonthDays.filter((d) => d.dayType === DayType.HOLIDAY).length;
  const totalWeekendDays = currentMonthDays.filter((d) => d.dayType === DayType.WEEKEND).length;
  
  const workingDays = currentMonthDays.filter((d) => d.dayType === DayType.WORKDAY);
  const totalWorkingDays = workingDays.length;

  // Remaining days: strictly days that are Workdays AND are >= today
  const remainingWorkingDays = workingDays.filter(d => {
    // Normalize grid date to midnight just in case
    const dDate = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate());
    return dDate.getTime() >= today.getTime();
  }).length;

  return {
    totalDays,
    totalWorkingDays,
    remainingWorkingDays,
    totalHolidays,
    totalWeekendDays,
    totalWorkingHours: totalWorkingDays * config.hoursPerDay,
  };
};