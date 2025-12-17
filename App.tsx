import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Briefcase, 
  Coffee,
  Wand2,
  Settings2,
  Loader2,
  Trash2,
  Hourglass,
  StickyNote,
  Sun,
  Moon,
  Zap,
  User,
  Download
} from 'lucide-react';

import { DayType, CalendarConfig, Theme } from './types';
import { generateCalendarGrid, calculateMonthStats, formatDateKey } from './utils/dateUtils';
import { fetchPublicHolidays } from './services/geminiService';
import { StatCard } from './components/StatCard';
import { ChartSection } from './components/ChartSection';
import { EditDayModal } from './components/EditDayModal';

// Default Configuration
const DEFAULT_CONFIG: CalendarConfig = {
  hoursPerDay: 8,
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  country: 'INDIA',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function App() {
  // State - with Local Storage Persistence
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wdp_theme');
      return (saved as Theme) || 'neon';
    }
    return 'neon';
  });

  const [viewDate, setViewDate] = useState(new Date());

  const [config, setConfig] = useState<CalendarConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wdp_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    }
    return DEFAULT_CONFIG;
  });

  const [customHolidays, setCustomHolidays] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wdp_holidays');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wdp_notes');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('wdp_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('wdp_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('wdp_holidays', JSON.stringify(customHolidays)); }, [customHolidays]);
  useEffect(() => { localStorage.setItem('wdp_notes', JSON.stringify(notes)); }, [notes]);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(date);
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarGrid = useMemo(() => 
    generateCalendarGrid(year, month, config, customHolidays, notes), 
  [year, month, config, customHolidays, notes]);

  const stats = useMemo(() => 
    calculateMonthStats(calendarGrid, config), 
  [calendarGrid, config]);

  // Initial Holiday Fetch on App Launch
  // Only auto-fetch if we don't have holidays for this month/year combination to avoid over-fetching or overwriting
  useEffect(() => {
    const initialFetch = async () => {
      // Simple check: if we already have some holidays, maybe don't auto-fetch blindly?
      // But user requirement was "Fetch on launching". 
      // We'll fetch and merge.
      if (!config.country) return;
      
      // Check if we already have data for this month to prevent aggressive overwrites on reload
      // A heuristic: check if any key in customHolidays starts with current YYYY-MM
      const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      const hasDataForMonth = Object.keys(customHolidays).some(k => k.startsWith(currentMonthPrefix));

      if (hasDataForMonth) {
         // console.log("Data exists for this month, skipping auto-fetch to preserve edits.");
         return; 
      }

      setIsAiLoading(true);
      try {
        const holidays = await fetchPublicHolidays(config.country, year, month);
        setCustomHolidays(prev => {
          const next = { ...prev };
          holidays.forEach(h => { 
             // Only add if not already present (preserve manual edits if any exist)
             if (!next[h.date]) {
                next[h.date] = h.name; 
             }
          });
          return next;
        });
      } catch (e) {
        console.error("Failed to auto-fetch holidays:", e);
      } finally {
        setIsAiLoading(false);
      }
    };

    initialFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleSaveDayDetails = (holidayName: string | undefined, note: string | undefined) => {
    if (!selectedDate) return;
    const key = formatDateKey(selectedDate);
    setCustomHolidays(prev => {
      const next = { ...prev };
      if (holidayName) next[key] = holidayName; else delete next[key];
      return next;
    });
    setNotes(prev => {
      const next = { ...prev };
      if (note) next[key] = note; else delete next[key];
      return next;
    });
  };

  const handleWorkDayToggle = (dayIndex: number) => {
    setConfig(prev => {
      const newWorkDays = prev.workDays.includes(dayIndex)
        ? prev.workDays.filter(d => d !== dayIndex)
        : [...prev.workDays, dayIndex].sort();
      return { ...prev, workDays: newWorkDays };
    });
  };

  const handleAiHolidayFetch = useCallback(async () => {
    if (!config.country) return;
    setIsAiLoading(true);
    try {
      const holidays = await fetchPublicHolidays(config.country, year, month);
      setCustomHolidays(prev => {
        const next = { ...prev };
        holidays.forEach(h => { next[h.date] = h.name; });
        return next;
      });
    } catch (e) {
      alert("Failed to fetch holidays. Please check your API connection.");
    } finally {
      setIsAiLoading(false);
    }
  }, [config.country, year, month]);

  const clearHolidays = () => {
    if (confirm("Remove all custom holidays and notes? This cannot be undone.")) {
      setCustomHolidays({});
      setNotes({});
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Day', 'Type', 'Holiday Name', 'Note', 'Working Hours'];
    const rows = calendarGrid
      .filter(d => d.isCurrentMonth)
      .map(d => {
        const dateStr = formatDateKey(d.date);
        const dayName = WEEKDAYS[(d.date.getDay() + 6) % 7]; // Adjust for Mon start index if needed, but getDay() is standard
        const type = d.dayType;
        const holiday = d.holidayName || '';
        const note = (d.note || '').replace(/,/g, ';'); // Escape commas
        const hours = d.dayType === DayType.WORKDAY ? config.hoursPerDay : 0;
        return [dateStr, d.date.toLocaleDateString('en-US', { weekday: 'short' }), type, holiday, note, hours].join(',');
      });

    const csvContent = [
      `Month Report: ${MONTHS[month]} ${year}`,
      `Total Working Days: ${stats.totalWorkingDays}`,
      `Total Working Hours: ${stats.totalWorkingHours}`,
      '',
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `workday-pro-${year}-${month + 1}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModalData = () => {
    if (!selectedDate) return { holiday: undefined, note: undefined, quote: undefined };
    const key = formatDateKey(selectedDate);
    // Find the dayStat in calendarGrid to get the quote
    const dayStat = calendarGrid.find(d => formatDateKey(d.date) === key);
    
    return { 
      holiday: customHolidays[key], 
      note: notes[key], 
      quote: dayStat?.quote
    };
  };

  // --- Theming Logic ---
  const getThemeStyles = () => {
    switch (theme) {
      case 'neon':
        return {
          appBg: 'bg-black text-cyan-50',
          sidebarBg: 'bg-slate-900 border-r border-slate-800',
          sidebarText: 'text-cyan-50',
          inputBg: 'bg-slate-800 border-slate-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/50',
          buttonPrimary: 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.5)]',
          buttonSecondary: 'text-rose-400 hover:text-rose-300',
          cardBg: 'bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-[0_0_10px_rgba(0,0,0,0.5)]',
          headerBg: 'bg-slate-900 border-b border-slate-800',
          dayDefault: 'bg-slate-900/80 border-slate-800 text-slate-400',
          dayCurrent: 'bg-slate-900 border-slate-700 text-cyan-50 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]',
          dayHoliday: 'bg-rose-950/30 border-rose-900/50 text-rose-200 hover:bg-rose-900/40',
          dayFirst: 'bg-cyan-950/30 border-cyan-500/50 text-cyan-100 hover:bg-cyan-900/40',
          dayLast: 'bg-fuchsia-950/30 border-fuchsia-500/50 text-fuchsia-100 hover:bg-fuchsia-900/40',
          dayWeekend: 'bg-slate-950 border-slate-900 text-slate-500',
          dayToday: 'bg-cyan-500/20 text-cyan-50 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]',
          iconColor: 'text-cyan-400',
          toggleActive: 'bg-cyan-600 text-white',
          toggleInactive: 'bg-slate-800 text-slate-400',
        };
      case 'dark':
        return {
          appBg: 'bg-slate-950 text-slate-200',
          sidebarBg: 'bg-slate-900 border-r border-slate-800',
          sidebarText: 'text-slate-200',
          inputBg: 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500',
          buttonPrimary: 'bg-indigo-600 text-white hover:bg-indigo-500',
          buttonSecondary: 'text-rose-400 hover:text-rose-300',
          cardBg: 'bg-slate-900 border border-slate-800',
          headerBg: 'bg-slate-900 border-b border-slate-800',
          dayDefault: 'bg-slate-900/50 text-slate-600 border-slate-800',
          dayCurrent: 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800',
          dayHoliday: 'bg-rose-900/20 border-rose-900/30 text-rose-200',
          dayFirst: 'bg-indigo-900/20 border-indigo-900/30 text-indigo-200',
          dayLast: 'bg-purple-900/20 border-purple-900/30 text-purple-200',
          dayWeekend: 'bg-slate-950 border-slate-900 text-slate-500',
          dayToday: 'bg-indigo-500/20 text-white ring-2 ring-indigo-500',
          iconColor: 'text-indigo-400',
          toggleActive: 'bg-indigo-600 text-white',
          toggleInactive: 'bg-slate-800 text-slate-400',
        };
      default: // light
        return {
          appBg: 'bg-slate-50 text-slate-900',
          sidebarBg: 'bg-white border-r border-slate-200',
          sidebarText: 'text-slate-900',
          inputBg: 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500',
          buttonPrimary: 'bg-slate-900 text-white hover:bg-slate-800',
          buttonSecondary: 'text-rose-600 hover:text-rose-700',
          cardBg: 'bg-white border border-slate-200 shadow-sm',
          headerBg: 'bg-white border-b border-slate-200',
          dayDefault: 'bg-slate-50/50 text-slate-400 border-slate-100',
          dayCurrent: 'bg-white border-slate-100 text-slate-700 hover:bg-indigo-50',
          dayHoliday: 'bg-rose-50 border-rose-100 text-rose-900 hover:bg-rose-100',
          dayFirst: 'bg-cyan-50 border-cyan-100 text-cyan-900 hover:bg-cyan-100',
          dayLast: 'bg-purple-50 border-purple-100 text-purple-900 hover:bg-purple-100',
          dayWeekend: 'bg-amber-50/50 border-amber-50/50 text-slate-600',
          dayToday: 'bg-indigo-50 text-indigo-900 ring-2 ring-indigo-600',
          iconColor: 'text-indigo-600',
          toggleActive: 'bg-indigo-600 text-white',
          toggleInactive: 'bg-slate-100 text-slate-500',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans ${styles.appBg}`}>
      
      {/* Sidebar Controls */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-all duration-300 ease-in-out ${showConfig ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 overflow-y-auto flex flex-col ${styles.sidebarBg} ${styles.sidebarText}`}
        aria-label="Configuration Sidebar"
      >
        <div className="p-6 space-y-8 flex-1">
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className={`w-8 h-8 ${styles.iconColor}`} aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight neon-text">WorkDay Pro</h1>
          </div>

          {/* Theme Switcher */}
          <div className="space-y-2">
             <h2 className="text-xs font-semibold uppercase opacity-60 tracking-wider">Appearance</h2>
             <div className="flex bg-opacity-20 rounded-lg overflow-hidden border border-opacity-10 border-current">
                <button onClick={() => setTheme('light')} aria-label="Switch to Light Theme" className={`flex-1 p-2 flex justify-center ${theme === 'light' ? styles.toggleActive : styles.toggleInactive}`}>
                   <Sun className="w-4 h-4" />
                </button>
                <button onClick={() => setTheme('dark')} aria-label="Switch to Dark Theme" className={`flex-1 p-2 flex justify-center ${theme === 'dark' ? styles.toggleActive : styles.toggleInactive}`}>
                   <Moon className="w-4 h-4" />
                </button>
                <button onClick={() => setTheme('neon')} aria-label="Switch to Neon Theme" className={`flex-1 p-2 flex justify-center ${theme === 'neon' ? styles.toggleActive : styles.toggleInactive}`}>
                   <Zap className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase opacity-60 tracking-wider">Configuration</h2>
            
            {/* Hours Per Day */}
            <div>
              <label htmlFor="hours-input" className="block text-sm font-medium mb-1">Hours / Day</label>
              <div className="relative">
                <input 
                  id="hours-input"
                  type="number" 
                  value={config.hoursPerDay}
                  onChange={(e) => setConfig({ ...config, hoursPerDay: Math.max(0, Number(e.target.value)) })}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg outline-none transition-all ${styles.inputBg}`}
                />
                <Clock className="w-4 h-4 opacity-50 absolute left-3 top-3" aria-hidden="true" />
              </div>
            </div>

            {/* Standard Work Days */}
            <div>
              <label className="block text-sm font-medium mb-2">Standard Work Days</label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select working days">
                {WEEKDAYS.map((day, index) => {
                  const dayValue = (index + 1) % 7;
                  const isActive = config.workDays.includes(dayValue);
                  return (
                    <button
                      key={day}
                      onClick={() => handleWorkDayToggle(dayValue)}
                      aria-pressed={isActive}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                        isActive 
                          ? `${styles.toggleActive} border-transparent shadow-md` 
                          : `${styles.toggleInactive} border-current border-opacity-10`
                      }`}
                    >
                      {day.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Holiday Importer */}
          <div className="space-y-4 pt-6 border-t border-opacity-10 border-current">
             <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase opacity-60 tracking-wider">Smart Holidays</h2>
                <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white`}>
                  AI Powered
                </div>
             </div>
            
            <div>
              <label htmlFor="country-input" className="block text-sm font-medium mb-1">Country / Region</label>
              <input 
                id="country-input"
                type="text" 
                value={config.country}
                onChange={(e) => setConfig({ ...config, country: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg outline-none transition-all mb-3 ${styles.inputBg}`}
                placeholder="e.g. India"
              />
              <button
                onClick={handleAiHolidayFetch}
                disabled={isAiLoading || !process.env.API_KEY}
                className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonPrimary}`}
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>Fetch Holidays</span>
              </button>
            </div>
             <button
                onClick={clearHolidays}
                className={`w-full flex items-center justify-center space-x-2 text-sm transition-colors mt-2 ${styles.buttonSecondary}`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset All Data</span>
              </button>
          </div>

          {/* Chart Summary (Sidebar) */}
          <div className="pt-6 border-t border-opacity-10 border-current">
             <ChartSection stats={stats} theme={theme} />
          </div>

          {/* Export Actions */}
           <div className="pt-4 border-t border-opacity-10 border-current">
             <button
                onClick={handleExport}
                className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors border ${styles.buttonSecondary} border-current border-opacity-30`}
              >
                <Download className="w-4 h-4" />
                <span>Export Month CSV</span>
              </button>
           </div>
        </div>

        {/* Footer with Author Credit */}
        <div className="p-4 border-t border-opacity-10 border-current">
           <div className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity">
              <div className={`p-2 rounded-full ${theme === 'neon' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-100 text-slate-600'}`}>
                <User className="w-4 h-4" />
              </div>
              <div className="text-xs">
                 <p className="font-semibold">BalajiDuddukuri</p>
                 <p className="opacity-70">Author & Developer</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden" role="main">
        
        {/* Header */}
        <header className={`px-6 py-4 flex items-center justify-between shrink-0 ${styles.headerBg}`}>
          <div className="flex items-center space-x-4">
             <button 
               className="md:hidden p-2 rounded-lg hover:bg-opacity-10 hover:bg-current"
               onClick={() => setShowConfig(!showConfig)}
               aria-label="Toggle Configuration Menu"
             >
                <Settings2 className="w-6 h-6" />
             </button>
             <h2 className="text-xl md:text-2xl font-bold">
               {MONTHS[month]} <span className="opacity-50 font-normal">{year}</span>
             </h2>
          </div>
          
          <div className={`flex items-center space-x-2 p-1 rounded-lg ${theme === 'neon' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button 
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-2 hover:bg-white/10 rounded-md transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewDate(new Date())}
              className="px-3 py-1 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Today
            </button>
            <button 
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-2 hover:bg-white/10 rounded-md transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0 overflow-x-auto" role="region" aria-label="Key Statistics">
          <StatCard 
            label="Total Days" 
            value={stats.totalDays} 
            icon={<CalendarIcon className={`w-5 h-5 ${styles.iconColor}`} />}
            colorClass={`${styles.cardBg} ${theme === 'neon' ? 'text-cyan-400' : ''}`}
          />
           <StatCard 
            label="Working Days" 
            value={stats.totalWorkingDays} 
            icon={<Briefcase className="w-5 h-5 text-emerald-500" />}
            colorClass={`${styles.cardBg} ${theme === 'neon' ? 'text-emerald-400' : ''}`}
          />
           <StatCard 
            label="Remaining" 
            value={stats.remainingWorkingDays} 
            icon={<Hourglass className="w-5 h-5 text-amber-500" />}
            colorClass={`${styles.cardBg} ${theme === 'neon' ? 'text-amber-400' : ''}`}
          />
           <StatCard 
            label="Working Hours" 
            value={stats.totalWorkingHours} 
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            colorClass={`${styles.cardBg} ${theme === 'neon' ? 'text-blue-400' : ''}`}
          />
           <StatCard 
            label="Off Days" 
            value={stats.totalHolidays + stats.totalWeekendDays} 
            icon={<Coffee className="w-5 h-5 text-rose-500" />}
            colorClass={`${styles.cardBg} ${theme === 'neon' ? 'text-rose-400' : ''}`}
          />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className={`rounded-xl overflow-hidden h-full min-h-[500px] flex flex-col ${styles.cardBg}`}>
            {/* Weekday Headers */}
            <div className={`grid grid-cols-7 border-b ${theme === 'neon' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
              {WEEKDAYS.map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold opacity-70 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days Grid - Fixed Rows for consistency */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1" role="grid">
              {calendarGrid.map((day, idx) => {
                const isWorkday = day.dayType === DayType.WORKDAY;
                const isHoliday = day.dayType === DayType.HOLIDAY;
                
                const dayOfWeek = day.date.getDay();
                const isSatSun = dayOfWeek === 0 || dayOfWeek === 6;
                
                // Determine base class based on state and theme
                let cellClass = styles.dayDefault;
                
                if (day.isCurrentMonth) {
                  if (isHoliday) {
                    cellClass = styles.dayHoliday;
                  } else if (day.isFirstDay) {
                    cellClass = styles.dayFirst;
                  } else if (day.isLastDay) {
                    cellClass = styles.dayLast;
                  } else if (isSatSun) {
                    cellClass = styles.dayWeekend;
                  } else if (isWorkday) {
                    cellClass = styles.dayCurrent;
                  }
                }

                const todayClass = day.isToday ? styles.dayToday : '';

                return (
                  <div 
                    key={`${day.date.toISOString()}-${idx}`}
                    role="gridcell"
                    tabIndex={day.isCurrentMonth ? 0 : -1}
                    onKeyDown={(e) => handleKeyDown(e, day.date)}
                    onClick={() => handleDayClick(day.date)}
                    title={day.quote} // Tooltip with quote
                    aria-label={`${day.date.toDateString()} ${isHoliday ? 'Holiday' : isWorkday ? 'Workday' : 'Weekend'} ${day.note ? 'has note' : ''}. Quote: ${day.quote}`}
                    className={`
                      relative p-2 border-b border-r transition-all cursor-pointer group flex flex-col justify-between outline-none
                      ${cellClass} ${todayClass}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full`}>
                        {day.date.getDate()}
                      </span>
                      {day.note && (
                        <StickyNote className="w-3 h-3 opacity-50 text-amber-400" />
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {isHoliday && (
                        <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${theme === 'neon' ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-white/50 border-current'}`}>
                          {day.holidayName || "Holiday"}
                        </div>
                      )}
                      
                      {day.isFirstDay && !isHoliday && (
                        <div className="text-[10px] font-medium opacity-70">Start</div>
                      )}
                      {day.isLastDay && !isHoliday && (
                        <div className="text-[10px] font-medium opacity-70">End</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <EditDayModal 
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedDate(null); }}
          date={selectedDate}
          existingHoliday={getModalData().holiday}
          existingNote={getModalData().note}
          onSave={handleSaveDayDetails}
          theme={theme}
          quote={getModalData().quote}
        />
      </main>
    </div>
  );
}