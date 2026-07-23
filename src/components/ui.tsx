import React from 'react';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addDays, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white p-4 md:p-6 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100", className)} {...props}>{children}</div>;
}

export function Button({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const base = "px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[44px]";
  const variants = {
    primary: "bg-[#18181b] text-white hover:bg-black shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn("w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all", className)} 
      {...props} 
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea 
      className={cn("w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none", className)} 
      rows={3}
      {...props} 
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select 
      className={cn("w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer", className)} 
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-xs font-medium text-gray-500 mb-1.5", className)} {...props}>{children}</label>;
}

export function Badge({ children, variant = 'default', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' }) {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
  };
  return <span className={cn("px-2.5 py-1.5 text-[11px] font-medium rounded-full", variants[variant], className)} {...props}>{children}</span>;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', destructive = true }: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full sm:max-w-md flex flex-col max-h-[90vh] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full cursor-pointer transition-colors">&times;</button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date());
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) setCurrentMonth(value);
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows: React.ReactNode[] = [];
  let days: React.ReactNode[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isSelected = value && isSameDay(day, value);
      const isTodayDate = isToday(day);
      days.push(
        <button
          type="button"
          key={day.toString()}
          onClick={() => { onChange(cloneDay); setIsOpen(false); }}
          className={cn(
            "w-10 h-10 text-sm rounded-full transition-colors cursor-pointer",
            !isCurrentMonth && "text-gray-300",
            isCurrentMonth && !isSelected && !isTodayDate && "text-gray-900 hover:bg-gray-100",
            isTodayDate && !isSelected && "bg-orange-100 text-orange-700 font-semibold",
            isSelected && "bg-[#18181b] text-white font-semibold"
          )}
        >
          {format(day, 'd')}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(<div key={day.toString()} className="flex justify-center gap-0.5">{days}</div>);
    days = [];
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 flex items-center gap-2 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer min-h-[44px]"
      >
        <Calendar size={16} className="text-gray-400 shrink-0" />
        <span>{value ? format(value, 'MMM d, yyyy') : 'Select date'}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="w-10 h-8 flex items-center justify-center text-[11px] font-semibold text-gray-400 uppercase">{d}</div>
            ))}
          </div>
          {rows}
        </div>
      )}
    </div>
  );
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer pl-10 min-h-[44px]"
      >
        {times.map(t => (
          <option key={t} value={t}>{format(new Date(`2000-01-01T${t}`), 'h:mm a')}</option>
        ))}
      </select>
      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
