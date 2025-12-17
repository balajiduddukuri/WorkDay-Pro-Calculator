import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MonthStats, Theme } from '../types';

interface ChartSectionProps {
  stats: MonthStats;
  theme: Theme;
}

export const ChartSection: React.FC<ChartSectionProps> = ({ stats, theme }) => {
  // Define colors based on theme
  const getColors = () => {
    switch (theme) {
      case 'neon':
        return {
          work: '#10b981', // Emerald 500
          weekend: '#64748b', // Slate 500
          holiday: '#f43f5e', // Rose 500
          text: '#e2e8f0', // Slate 200
          bg: '#0f172a' // Slate 900
        };
      case 'dark':
        return {
          work: '#34d399',
          weekend: '#475569',
          holiday: '#fb7185',
          text: '#e2e8f0',
          bg: '#1e293b'
        };
      default: // light
        return {
          work: '#10b981',
          weekend: '#94a3b8',
          holiday: '#f43f5e',
          text: '#334155',
          bg: '#ffffff'
        };
    }
  };

  const colors = getColors();

  const data = [
    { name: 'Working Days', value: stats.totalWorkingDays, color: colors.work },
    { name: 'Weekends', value: stats.totalWeekendDays, color: colors.weekend },
    { name: 'Holidays', value: stats.totalHolidays, color: colors.holiday },
  ].filter(d => d.value > 0);

  const containerClass = theme === 'neon' 
    ? 'bg-slate-900/50 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] text-cyan-50'
    : theme === 'dark'
      ? 'bg-slate-800 border-slate-700 text-slate-200'
      : 'bg-white border-slate-200 text-slate-700';

  return (
    <div className={`h-64 w-full rounded-xl border p-4 shadow-sm flex flex-col ${containerClass}`} role="region" aria-label="Month Statistics Chart">
      <h3 className="text-sm font-semibold mb-2 opacity-90">Month Distribution</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                backgroundColor: colors.bg,
                color: colors.text,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' 
              }}
              itemStyle={{ color: colors.text }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};