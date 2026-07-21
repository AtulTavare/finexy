import React, { useState } from 'react';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Label, Modal } from '../components/ui';
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
  addDays, 
  parseISO,
  isWithinInterval,
  isBefore,
  differenceInDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function AppCalendar() {
  const { projects, meetings, clients, addMeeting } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    setShowModal(true);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tighter">
          {format(currentMonth, 'MMMM yyyy')}
        </h1>
        <div className="flex space-x-2">
          <Button onClick={prevMonth} className="px-2 bg-gray-100 border-gray-200 hover:bg-gray-200"><ChevronLeft size={16} /></Button>
          <Button onClick={nextMonth} className="px-2 bg-gray-100 border-gray-200 hover:bg-gray-200"><ChevronRight size={16} /></Button>
          <Button onClick={() => { setSelectedDate(new Date()); setShowModal(true); }} className="ml-2 md:ml-4 px-3 md:px-4"><span className="hidden md:inline">+ Add Meeting</span><Plus size={16} className="md:hidden" /></Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="flex-1 text-center text-xs font-semibold uppercase tracking-wider text-gray-900 py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="flex">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;

        // Get Meetings for this day
        const dayMeetings = meetings.filter(m => isSameDay(parseISO(m.date), cloneDay));
        const hasMeeting = dayMeetings.length > 0;

        // Get Projects active on this day
        const dayProjects = projects.filter(p => {
          const sDate = parseISO(p.startDate);
          const eDate = parseISO(p.deadline);
          // Only show if it's within start and end, or exactly same day
          return (day >= sDate && day <= eDate) || isSameDay(sDate, day) || isSameDay(eDate, day);
        });

        days.push(
          <div
            className={`flex-1 min-h-[100px] border border-gray-200 p-1 flex flex-col cursor-pointer transition-colors
              ${!isSameMonth(day, monthStart) ? "text-gray-400 bg-white/50" : hasMeeting ? "bg-orange-100 hover:bg-orange-500 text-white border-gray-200" : "hover:bg-gray-100 bg-white"}
            `}
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className={`text-xs font-semibold self-end mr-1 ${hasMeeting ? 'text-yellow-500' : ''}`}>
              {formattedDate}
            </span>
            <div className="flex-1 overflow-y-auto no-scrollbar mt-1 space-y-1 hide-scrollbar">
              {dayMeetings.map(m => {
                const client = clients.find(c => c.id === m.clientId);
                return (
                  <div key={m.id} className="text-[10px] bg-orange-500 text-white px-1 py-0.5 rounded border border-gray-200 truncate">
                    {m.time} - {client?.name || m.title}
                  </div>
                );
              })}
              {dayProjects.map(p => {
                const sDate = parseISO(p.startDate);
                const eDate = parseISO(p.deadline);
                const isStart = isSameDay(sDate, cloneDay);
                const isEnd = isSameDay(eDate, cloneDay);
                const daysUntilEnd = differenceInDays(eDate, cloneDay);
                
                let dotColor = "bg-gray-500";
                if (p.status === 'In Progress') dotColor = "bg-blue-500";
                if (daysUntilEnd >= 0 && daysUntilEnd <= 3 && p.status !== 'Completed') dotColor = "bg-red-500";
                if (isStart) dotColor = "bg-green-500";
                if (p.status === 'Completed') dotColor = "bg-emerald-500";

                // Only show text if it's the start, end, or a Monday to reduce clutter, or if there's only a few days
                const showText = isStart || isEnd || day.getDay() === 1 || p.title.length > 0;

                return (
                  <div key={p.id} className="flex items-center space-x-1 px-1 truncate">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                    {showText && <span className="text-[10px] text-gray-900 truncate">{p.title}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col border border-gray-200">{rows}</div>;
  };

  return (
    <div className="flex flex-col space-y-6">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <MeetingModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={addMeeting}
        clients={clients}
        initialDate={selectedDate}
      />
    </div>
  );
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Meeting, 'id' | 'createdAt'>) => void;
  clients: Client[];
  initialDate: Date | null;
}

function MeetingModal({ isOpen, onClose, onSave, clients, initialDate }: MeetingModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');

  // Update date when initialDate changes
  React.useEffect(() => {
    if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
  }, [initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !clientId) return;
    onSave({ 
      title: title || (clients.find((c:any) => c.id === clientId)?.name + ' Meeting'), 
      clientId, 
      date, 
      time 
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Client</Label>
          <select 
            value={clientId} 
            onChange={e => setClientId(e.target.value)} 
            className="w-full bg-gray-100 border border-gray-200 rounded-md p-2 text-sm text-gray-900 focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="">Select Client (Optional)</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Meeting Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sync Call" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} required /></div>
        </div>
        
        <Button type="submit" className="w-full mt-4">Save Meeting</Button>
      </form>
    </Modal>
  );
}
