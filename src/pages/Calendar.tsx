import React, { useState } from 'react';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Label, Modal, DatePicker, TimePicker, Textarea, ConfirmDialog } from '../components/ui';
import { Client, Meeting } from '../types';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isBefore,
  startOfToday,
  addDays, 
  parseISO,
  differenceInDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Edit2 } from 'lucide-react';

export default function AppCalendar() {
  const { projects, meetings, clients, addMeeting, updateMeeting, deleteMeeting } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.date), day));
    const dayProjects = projects.filter(p => {
      const s = parseISO(p.startDate); const e = parseISO(p.deadline);
      return (day >= s && day <= e);
    });
    if (dayMeetings.length > 0 || dayProjects.length > 0) {
      setDetailDate(day);
    } else {
      setSelectedDate(day);
      setShowModal(true);
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold tracking-tighter">{format(currentMonth, 'MMMM yyyy')}</h1>
      <div className="flex space-x-2">
        <Button onClick={prevMonth} className="px-2 bg-gray-100 border-gray-200 hover:bg-gray-200"><ChevronLeft size={16} /></Button>
        <Button onClick={nextMonth} className="px-2 bg-gray-100 border-gray-200 hover:bg-gray-200"><ChevronRight size={16} /></Button>
        <Button onClick={() => { setSelectedDate(new Date()); setShowModal(true); }} className="ml-2 md:ml-4 px-3 md:px-4"><span className="hidden md:inline">+ Add Meeting</span><Plus size={16} className="md:hidden" /></Button>
      </div>
    </div>
  );

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-900 py-1 md:py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = startOfToday();

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.date), cloneDay));
        const hasMeeting = dayMeetings.length > 0;
        const dayProjects = projects.filter(p => {
          const s = parseISO(p.startDate); const e = parseISO(p.deadline);
          return day >= s && day <= e;
        });
        const isTodayDate = isToday(day);
        const isPastDate = isBefore(day, today) && !isTodayDate;
        const hasEvents = dayMeetings.length > 0 || dayProjects.length > 0;

        days.push(
          <div
            className={`min-w-0 overflow-hidden min-h-[60px] md:min-h-[100px] border border-gray-200 p-0.5 md:p-1 flex flex-col cursor-pointer transition-colors
              ${!isSameMonth(day, monthStart) ? "text-gray-300 bg-white/50" : ""}
              ${isTodayDate ? "bg-orange-50 border-orange-300" : ""}
              ${isPastDate && isSameMonth(day, monthStart) ? "bg-gray-50" : ""}
              ${!isTodayDate && !isPastDate && isSameMonth(day, monthStart) ? (hasEvents ? "bg-orange-100 hover:bg-orange-500 hover:text-white" : "hover:bg-gray-100 bg-white") : ""}
            `}
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className={`text-[10px] md:text-xs font-semibold self-end mr-1 
              ${isTodayDate ? 'bg-orange-500 text-white w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full' : ''}
              ${isPastDate && !isTodayDate ? 'text-gray-400' : ''}
              ${hasEvents && !isTodayDate && !isPastDate ? 'text-orange-700' : ''}
            `}>
              {format(day, "d")}
            </span>
            <div className="flex-1 overflow-y-auto no-scrollbar mt-1 space-y-1">
              {dayMeetings.map(m => {
                const client = clients.find(c => c.id === m.clientId);
                return (
                  <div key={m.id} className={`text-[8px] md:text-[10px] text-white px-0.5 md:px-1 py-0.5 rounded truncate ${isPastDate ? 'bg-gray-400' : 'bg-orange-500'}`}>
                    <span className="truncate block">{m.time} - {client?.name || m.leadName || m.title}</span>
                  </div>
                );
              })}
              {dayProjects.map(p => {
                const isStart = isSameDay(parseISO(p.startDate), cloneDay);
                const daysUntilEnd = differenceInDays(parseISO(p.deadline), cloneDay);
                let dotColor = "bg-gray-500";
                if (p.status === 'In Progress') dotColor = "bg-blue-500";
                if (daysUntilEnd >= 0 && daysUntilEnd <= 3 && p.status !== 'Completed') dotColor = "bg-red-500";
                if (isStart) dotColor = "bg-green-500";
                if (p.status === 'Completed') dotColor = "bg-emerald-500";
                return (
                  <div key={p.id} className="flex items-center space-x-1 px-1 truncate">
                    <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${dotColor} shrink-0`} />
                    <span className="text-[8px] md:text-[10px] text-gray-900 truncate">{p.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="flex flex-col border border-gray-200">{rows}</div>;
  };

  const renderDetailPanel = () => {
    if (!detailDate) return null;
    const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.date), detailDate));
    const dayProjects = projects.filter(p => {
      const s = parseISO(p.startDate); const e = parseISO(p.deadline);
      return detailDate >= s && detailDate <= e;
    });

    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{format(detailDate, 'MMMM d, yyyy')}</h2>
          <div className="flex items-center space-x-2">
            <Button className="px-3 py-1 text-xs" onClick={() => { setSelectedDate(detailDate); setShowModal(true); }}>+ Add</Button>
            <button onClick={() => setDetailDate(null)} className="text-gray-900 hover:text-gray-400 p-1 cursor-pointer"><X size={16} /></button>
          </div>
        </div>
        {dayMeetings.length === 0 && dayProjects.length === 0 ? (
          <div className="text-gray-900 text-sm italic">No events on this day.</div>
        ) : (
          <div className="space-y-3">
            {dayMeetings.map(m => {
              const client = clients.find(c => c.id === m.clientId);
              return (
                <div key={m.id} className="flex items-start justify-between p-3 bg-orange-50 rounded-xl border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => { setEditingMeeting(m); setShowModal(true); }}>
                  <div>
                    <div className="font-medium text-sm">{client?.name || m.leadName || m.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.time} &bull; {m.reason || 'No reason'}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><X size={14} /></button>
                </div>
              );
            })}
            {dayProjects.map(p => (
              <div key={p.id} className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="font-medium text-sm">{p.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.status} &bull; {format(parseISO(p.startDate), 'MMM d')} - {format(parseISO(p.deadline), 'MMM d')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
      <div className="flex-1 flex flex-col space-y-6">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      {detailDate && (
        <div className="lg:w-80 shrink-0">
          {renderDetailPanel()}
        </div>
      )}
      
      <MeetingModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingMeeting(null); setSelectedDate(null); }} 
        onSave={addMeeting}
        onUpdate={updateMeeting}
        clients={clients}
        initialDate={selectedDate}
        editItem={editingMeeting}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Meeting"
        message={`Are you sure you want to delete the meeting "${deleteTarget?.title}"?`}
        onConfirm={() => { if (deleteTarget) deleteMeeting(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Meeting, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Meeting>) => void;
  clients: Client[];
  initialDate: Date | null;
  editItem?: Meeting | null;
}

function MeetingModal({ isOpen, onClose, onSave, onUpdate, clients, initialDate, editItem }: MeetingModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editItem) {
      setTitle(editItem.title); setClientId(editItem.clientId || ''); setLeadName(editItem.leadName || ''); setDate(new Date(editItem.date)); setTime(editItem.time); setReason(editItem.reason || '');
    } else {
      setTitle(''); setClientId(''); setLeadName(''); setDate(initialDate || new Date()); setTime('10:00'); setReason('');
    }
  }, [editItem, initialDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId && !leadName) {
      setError('Please select a client or enter a lead name.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    const today = startOfToday();
    if (isBefore(date, today)) {
      setError('Meeting date must be today or in the future.');
      return;
    }

    const generatedTitle = title || (clientId
      ? (clients.find(c => c.id === clientId)?.name + ' Meeting')
      : (leadName + ' Meeting'));

    if (editItem && onUpdate) {
      onUpdate(editItem.id, {
        title: generatedTitle,
        clientId: clientId || undefined,
        leadName: leadName || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time,
        reason: reason || undefined,
      });
    } else {
      onSave({
        title: generatedTitle,
        clientId: clientId || undefined,
        leadName: leadName || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time,
        reason: reason || undefined,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Meeting' : 'Schedule Meeting'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Client</Label>
          <select
            value={clientId}
            onChange={e => { setClientId(e.target.value); if (e.target.value) setLeadName(''); }}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="text-center text-xs text-gray-400">— or —</div>
        <div>
          <Label>Lead Name</Label>
          <Input
            value={leadName}
            onChange={e => { setLeadName(e.target.value); if (e.target.value) setClientId(''); }}
            placeholder="e.g. John Doe"
          />
        </div>
        <div><Label>Meeting Title (Optional)</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto-generated if empty" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Date</Label><DatePicker value={date} onChange={setDate} /></div>
          <div><Label>Time</Label><TimePicker value={time} onChange={setTime} /></div>
        </div>
        <div><Label>Reason (Optional)</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Purpose of the meeting..." /></div>
        
        {error && <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Meeting' : 'Save Meeting'}</Button>
      </form>
    </Modal>
  );
}
