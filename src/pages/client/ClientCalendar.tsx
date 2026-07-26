import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientData } from '../../store/ClientDataContext';
import { Card } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, CircleDot } from 'lucide-react';

export default function ClientCalendar() {
  const navigate = useNavigate();
  const { projects, meetings, installments } = useClientData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [detailDate, setDetailDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);

  const days: Date[] = [];
  let day = calStart;
  for (let i = 0; i < 42; i++) {
    days.push(day);
    day = addDays(day, 1);
  }

  const dayMeetings = (d: Date) => meetings.filter(m => isSameDay(parseISO(m.date), d));
  const dayProjects = (d: Date) => projects.filter(p => {
    const s = parseISO(p.startDate);
    const e = parseISO(p.deadline);
    return d >= s && d <= e;
  });
  const dayInstallments = (d: Date) => installments.filter(i => isSameDay(parseISO(i.dueDate), d));
  const selectedDayEvents = detailDate ? {
    meetings: dayMeetings(detailDate),
    projects: dayProjects(detailDate),
    installments: dayInstallments(detailDate),
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Your project timelines, meetings, and installment due dates.</p>
      </div>

      <Card className="p-4 md:p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 min-w-[160px] text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-xs text-orange-600 font-medium hover:underline cursor-pointer">Today</button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] md:text-xs font-semibold text-gray-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const isCurrentMonth = isSameMonth(d, currentMonth);
            const isToday = isSameDay(d, new Date());
            const m = dayMeetings(d);
            const p = dayProjects(d);
            const insts = dayInstallments(d);
            const hasEvents = m.length > 0 || p.length > 0 || insts.length > 0;
            return (
              <div
                key={i}
                className={`min-h-[56px] md:min-h-[80px] border border-gray-100 p-1 cursor-pointer transition-colors hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50' : ''} ${isToday ? 'bg-orange-50 border-orange-200' : ''}`}
                onClick={() => setDetailDate(d)}
              >
                <div className={`text-[10px] md:text-xs font-medium mb-0.5 ${isToday ? 'text-orange-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                  {format(d, 'd')}
                </div>
                {hasEvents && (
                  <div className="space-y-0.5">
                    {m.slice(0, 2).map(me => (
                      <div key={me.id} className="text-[7px] md:text-[9px] text-white px-0.5 md:px-1 py-0.5 rounded truncate bg-orange-500 leading-tight">
                        {me.time} {me.reason || me.title}
                      </div>
                    ))}
                    {p.slice(0, 1).map(pr => (
                      <div key={pr.id} className="flex items-center gap-0.5 truncate">
                        <CircleDot size={6} className="text-blue-500 shrink-0" />
                        <span className="text-[7px] md:text-[9px] text-gray-700 truncate">{pr.title}</span>
                      </div>
                    ))}
                    {insts.slice(0, 1).map(inst => (
                      <div key={inst.id} className="text-[7px] md:text-[9px] text-white px-0.5 py-0.5 rounded truncate bg-purple-500 leading-tight">
                        Due {formatCurrency(inst.amount)}
                      </div>
                    ))}
                    {(m.length + p.length + insts.length) > 2 && (
                      <div className="text-[7px] text-gray-400">+{m.length + p.length + insts.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {detailDate && selectedDayEvents && (
        <Card className="p-4 md:p-6 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{format(detailDate, 'EEEE, MMMM d, yyyy')}</h3>
            <button onClick={() => setDetailDate(null)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Close</button>
          </div>
          {selectedDayEvents.meetings.length === 0 && selectedDayEvents.projects.length === 0 && selectedDayEvents.installments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.meetings.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{m.title}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.time}</span>
                    {m.reason && <span className="text-xs text-gray-400 ml-2">— {m.reason}</span>}
                  </div>
                </div>
              ))}
              {selectedDayEvents.installments.map(inst => (
                <div key={inst.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{inst.serviceName}</span>
                      <span className="text-xs text-gray-500 ml-2">Installment due</span>
                    </div>
                    <span className="text-sm tabular font-semibold text-gray-900">{formatCurrency(inst.amount)}</span>
                  </div>
                </div>
              ))}
              {selectedDayEvents.projects.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => navigate(`/client/projects/${p.id}`)}>
                  <CircleDot size={16} className="text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{p.title}</span>
                    <span className="text-xs text-gray-500 ml-2">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
