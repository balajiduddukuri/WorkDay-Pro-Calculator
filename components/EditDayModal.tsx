import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Quote } from 'lucide-react';
import { Theme } from '../types';

interface EditDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  existingHoliday?: string;
  existingNote?: string;
  onSave: (holiday: string | undefined, note: string | undefined) => void;
  theme: Theme;
  quote?: string;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({ 
  isOpen, onClose, date, existingHoliday, existingNote, onSave, theme, quote
}) => {
  const [holiday, setHoliday] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
        setHoliday(existingHoliday || '');
        setNote(existingNote || '');
    }
  }, [isOpen, existingHoliday, existingNote]);

  if (!isOpen || !date) return null;

  const handleSave = () => {
    onSave(holiday.trim() || undefined, note.trim() || undefined);
    onClose();
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to remove all notes and holiday settings for this day?")) {
        onSave(undefined, undefined);
        onClose();
    }
  };

  const hasData = !!existingHoliday || !!existingNote;

  // Theme-based styles
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark';

  const modalBg = isNeon 
    ? 'bg-slate-900 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
    : isDark 
      ? 'bg-slate-800 border border-slate-700' 
      : 'bg-white';

  const headerBg = isNeon 
    ? 'bg-slate-900/50 border-slate-800'
    : isDark 
      ? 'bg-slate-800 border-slate-700'
      : 'bg-slate-50/50 border-slate-100';

  const textPrimary = isNeon || isDark ? 'text-slate-200' : 'text-slate-800';
  const textSecondary = isNeon || isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isNeon 
    ? 'bg-slate-800 border-slate-700 text-cyan-50 focus:border-cyan-500 focus:ring-cyan-500/30'
    : isDark
      ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500'
      : 'bg-white border-slate-300 focus:ring-indigo-500';
      
  const footerBg = isNeon 
    ? 'bg-slate-900/80 border-t border-slate-800'
    : isDark
      ? 'bg-slate-800 border-t border-slate-700'
      : 'bg-slate-50 border-t border-slate-100';

  const quoteBg = isNeon 
    ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-200' 
    : isDark 
      ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200' 
      : 'bg-indigo-50 border-indigo-100 text-indigo-800';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`${modalBg} rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200`}>
         {/* Header */}
         <div className={`px-4 py-3 border-b flex justify-between items-center ${headerBg}`}>
           <h3 className={`font-semibold ${textPrimary}`}>
             {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
           </h3>
           <button onClick={onClose} className={`${textSecondary} hover:text-white transition-colors`}>
             <X className="w-5 h-5" />
           </button>
         </div>
         
         {/* Body */}
         <div className="p-4 space-y-4">
           
           {/* Quote Section */}
           {quote && (
             <div className={`p-3 rounded-lg border text-sm italic relative ${quoteBg}`}>
               <Quote className="w-4 h-4 absolute top-2 left-2 opacity-50" />
               <p className="pl-6">{quote}</p>
             </div>
           )}

           <div>
             <label className={`block text-xs font-medium uppercase mb-1 ${textSecondary}`}>Holiday / Day Off</label>
             <input 
               type="text" 
               className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm transition-all ${inputBg}`}
               placeholder="e.g. Public Holiday"
               value={holiday}
               onChange={e => setHoliday(e.target.value)}
             />
             <p className={`text-[10px] mt-1 ${textSecondary}`}>Entering a name marks this day as a holiday.</p>
           </div>
           
           <div>
             <label className={`block text-xs font-medium uppercase mb-1 ${textSecondary}`}>Personal Note</label>
             <textarea 
               className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-sm min-h-[80px] resize-none transition-all ${inputBg}`}
               placeholder="Add details..."
               value={note}
               onChange={e => setNote(e.target.value)}
             />
           </div>
         </div>

         {/* Footer */}
         <div className={`px-4 py-3 flex justify-between items-center ${footerBg}`}>
            {/* Delete Option */}
            <div>
                {hasData && (
                    <button 
                        onClick={handleClear}
                        className="flex items-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium"
                        title="Clear all data for this day"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
                <button 
                  onClick={onClose} 
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isNeon || isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button 
                    onClick={handleSave} 
                    className={`px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm flex items-center ${isNeon ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};