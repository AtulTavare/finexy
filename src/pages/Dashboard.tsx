import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Label, Modal, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { format, subMonths, isAfter, startOfMonth, isBefore, addDays, startOfToday, startOfWeek, subWeeks, subDays, startOfDay } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const data = useData();
  const navigate = useNavigate();
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  // --- Calculations ---
  const today = startOfToday();

  const filterStart = useMemo(() => {
    if (timeFilter === 'Daily') return startOfDay(today);
    if (timeFilter === 'Weekly') return startOfWeek(today);
    return startOfMonth(today);
  }, [timeFilter, today]);

  // Total Net Position
  const totalReceivables = data.engagements.filter(e => e.status === 'Active').reduce((sum, e) => {
    const paid = data.businessPayments.filter(p => p.engagementId === e.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, e.value - paid);
  }, 0);
  const outstandingDebts = data.personalDebts.filter(d => d.type === 'I Owe' && d.status !== 'Paid').reduce((sum, d) => sum + d.amount, 0);
  const businessCash = data.businessPayments.reduce((s, p) => s + p.amount, 0) - data.businessExpenses.reduce((s, e) => s + e.amount, 0) - data.ownerDraws.reduce((s, d) => s + d.amount, 0);
  const personalNet = data.personalIncome.reduce((s, i) => s + i.amount, 0) - data.personalExpenses.reduce((s, e) => s + e.amount, 0);
  const netPosition = personalNet + businessCash + totalReceivables - outstandingDebts;

  // Period Cash Flow
  const periodInc = 
    data.personalIncome.filter(i => isAfter(new Date(i.date), filterStart)).reduce((s,i) => s+i.amount, 0) +
    data.businessPayments.filter(p => isAfter(new Date(p.date), filterStart)).reduce((s,p) => s+p.amount, 0) -
    data.ownerDraws.filter(d => isAfter(new Date(d.date), filterStart)).reduce((s,d) => s+d.amount, 0);
  
  const periodExp = 
    data.personalExpenses.filter(e => isAfter(new Date(e.date), filterStart)).reduce((s,e) => s+e.amount, 0) +
    data.businessExpenses.filter(e => isAfter(new Date(e.date), filterStart)).reduce((s,e) => s+e.amount, 0);
  
  const periodNet = periodInc - periodExp;

  // Pipeline
  const totalLeadsCount = data.leads.length;
  const wonLeadsCount = data.leads.filter(l => l.stage === 'Won').length;
  const convRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;
  const pipelineValue = data.leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').reduce((s, l) => s + l.estimatedValue, 0);
  const mrr = data.engagements.filter(e => e.status === 'Active' && e.paymentTerms === 'Retainer').reduce((s, e) => s + e.value, 0);

  // Trend Data (Based on filter)
  const trendData = useMemo(() => {
    let periods = [];
    if (timeFilter === 'Monthly') {
      periods = Array.from({length: 6}).map((_, i) => subMonths(startOfMonth(today), 5 - i));
    } else if (timeFilter === 'Weekly') {
      periods = Array.from({length: 6}).map((_, i) => subWeeks(startOfWeek(today), 5 - i));
    } else {
      periods = Array.from({length: 7}).map((_, i) => subDays(startOfDay(today), 6 - i));
    }

    return periods.map(p => {
      const nextP = timeFilter === 'Monthly' ? addDays(p, 31) : timeFilter === 'Weekly' ? addDays(p, 7) : addDays(p, 1);
      const inc = data.personalIncome.filter(i => new Date(i.date) >= p && new Date(i.date) < nextP).reduce((s,x) => s+x.amount, 0) + data.businessPayments.filter(i => new Date(i.date) >= p && new Date(i.date) < nextP).reduce((s,x) => s+x.amount, 0);
      const exp = data.personalExpenses.filter(e => new Date(e.date) >= p && new Date(e.date) < nextP).reduce((s,x) => s+x.amount, 0) + data.businessExpenses.filter(e => new Date(e.date) >= p && new Date(e.date) < nextP).reduce((s,x) => s+x.amount, 0);
      return { 
        name: timeFilter === 'Monthly' ? format(p, 'MMM') : timeFilter === 'Weekly' ? format(p, 'MMM d') : format(p, 'EEE'), 
        Income: inc, 
        Expense: exp 
      };
    });
  }, [timeFilter, today, data]);

  // Expenses Pie Chart
  const expenseCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    data.personalExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    data.businessExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(c => c.value > 0).sort((a,b) => b.value - a.value);
  }, [data.personalExpenses, data.businessExpenses]);

  const COLORS = ['#f97316', '#18181b', '#fb923c', '#3f3f46', '#fdba74', '#71717a'];

  // Needs Attention
  const nextWeek = addDays(today, 7);
  const attentionItems: {id: string, title: string, subtitle: string, date: Date, type: 'task' | 'debt'}[] = [];
  
  data.tasks.filter(t => !t.isCompleted && isBefore(new Date(t.dueDate), nextWeek)).forEach(t => {
    attentionItems.push({ id: t.id, title: t.title, subtitle: `Task (${t.type})`, date: new Date(t.dueDate), type: 'task' });
  });
  data.personalDebts.filter(d => d.type === 'I Owe' && d.status !== 'Paid' && isBefore(new Date(d.dueDate), nextWeek)).forEach(d => {
    attentionItems.push({ id: d.id, title: `Owe ${d.partyName}`, subtitle: formatCurrency(d.amount), date: new Date(d.dueDate), type: 'debt' });
  });
  
  attentionItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  const triggerEvent = (event: string, path: string) => {
    navigate(path, { state: { openModal: event } });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Unified view of your empire.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button onClick={() => triggerEvent('open-income-modal', '/personal')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs py-1.5 px-3 flex-1 lg:flex-none text-gray-900 shadow-sm"><ArrowUpRight size={14} className="mr-1 inline" /> Income</Button>
          <Button onClick={() => triggerEvent('open-expense-modal', '/personal')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs py-1.5 px-3 flex-1 lg:flex-none text-gray-900 shadow-sm"><ArrowDownRight size={14} className="mr-1 inline" /> Expense</Button>
          <Button onClick={() => triggerEvent('open-lead-modal', '/business')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs py-1.5 px-3 flex-1 lg:flex-none text-gray-900 shadow-sm"><Briefcase size={14} className="mr-1 inline" /> Lead</Button>
          <Button onClick={() => triggerEvent('open-task-modal', '/tasks')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs py-1.5 px-3 flex-1 lg:flex-none text-gray-900 shadow-sm"><PlusCircle size={14} className="mr-1 inline" /> Task</Button>
          <Button onClick={() => setShowDrawModal(true)} className="text-xs py-1.5 px-3 w-full sm:w-auto mt-2 sm:mt-0 shadow-sm">Owner Draw</Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-gray-200 pb-4">
        <span className="text-xs font-semibold  text-gray-900 mr-2">Filter:</span>
        {(['Daily', 'Weekly', 'Monthly'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setTimeFilter(t)}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors ${timeFilter === t ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-900 hover:text-gray-900'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Net Position" value={netPosition}  />
        <MetricCard title={`${timeFilter} Cash Flow`} value={periodNet} isPositive={periodNet >= 0}  />
        <MetricCard title="Receivables" value={totalReceivables}  />
        <MetricCard title="Total Debt" value={outstandingDebts} isDebt  />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white">
            <h2 className="text-sm font-semibold  text-gray-900 mb-6">Cash Flow Over Time</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="name" stroke="transparent" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: "1px solid #f3f4f6", borderRadius: '8px', boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontWeight: 'bold' }} itemStyle={{ fontSize: '12px', color: "#374151" }} cursor={{fill: '#fef08a'}} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: "#374151" }} />
                  <Bar dataKey="Income" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} stroke="transparent"  />
                  <Bar dataKey="Expense" fill="#18181b" radius={[4, 4, 0, 0]} barSize={20} stroke="transparent"  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white">
              <h2 className="text-sm font-semibold  text-gray-900 mb-6">Expenses by Category</h2>
              <div className="h-48 w-full flex items-center justify-center relative">
                {expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="transparent"
                        
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: "1px solid #f3f4f6", borderRadius: '8px', boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", fontWeight: 'bold' }} itemStyle={{ fontSize: '12px', color: "#374151" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-gray-900 font-semibold text-sm">No expenses found</span>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 flex flex-col justify-center">
                <div className="text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Pipeline Value</div>
                <div className="text-2xl tabular font-semibold">{formatCurrency(pipelineValue)}</div>
                <div className="text-xs text-gray-800 mt-1 font-semibold">{convRate}% Conv. Rate</div>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <div className="text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Active MRR</div>
                <div className="text-2xl tabular text-green-700 font-semibold">{formatCurrency(mrr)}</div>
                <div className="text-xs text-gray-800 mt-1 font-semibold">From Retainers</div>
              </Card>
              <Card className="p-4 col-span-2 flex flex-col justify-center">
                <div className="text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Business Cash</div>
                <div className="text-2xl tabular font-semibold">{formatCurrency(businessCash)}</div>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-0 flex flex-col h-[500px] bg-white">
            <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center rounded-t-lg">
              <h2 className="text-sm font-semibold  text-gray-900">Needs Attention</h2>
              <Badge variant="danger">{attentionItems.length}</Badge>
            </div>
            <div className="overflow-y-auto no-scrollbar p-4 space-y-3">
              {attentionItems.length === 0 ? (
                <div className="text-gray-900 text-sm italic font-semibold">All caught up!</div>
              ) : (
                attentionItems.map((item, i) => {
                  const isPast = isBefore(item.date, today);
                  return (
                    <div key={i} className={`border-l-4 pl-3 py-1 ${item.type === 'debt' ? 'border-orange-500' : 'border-gray-200'}`}>
                      <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                      <div className={`text-xs mt-1 font-semibold ${isPast ? 'text-red-600' : 'text-gray-800'}`}>
                        {isPast ? 'Overdue' : 'Due'} {format(item.date, 'MMM d')} &bull; {item.subtitle}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <DrawModal isOpen={showDrawModal} onClose={() => setShowDrawModal(false)} onSave={data.processOwnerDraw} maxAmount={businessCash} />
    </div>
  );
}

function MetricCard({ title, value, isPositive, isDebt }: { title: string, value: number, isPositive?: boolean, isDebt?: boolean }) {
  const color = isDebt ? (value > 0 ? 'text-red-500' : 'text-gray-900') : (isPositive === true ? 'text-emerald-500' : isPositive === false ? 'text-red-500' : 'text-gray-900');
  const bgColor = title === "Net Position" ? "bg-[#18181b] text-white" : isPositive === true ? "bg-[#f97316] text-white" : "bg-white text-gray-900";
  const labelColor = title === "Net Position" ? "text-gray-400" : isPositive === true ? "text-orange-100" : "text-gray-500";
  const valColor = title === "Net Position" ? "text-white" : isPositive === true ? "text-white" : color;
  
  return (
    <Card className={`p-6 flex flex-col justify-center ${bgColor}`}>
      <div className={`text-sm font-medium mb-2 ${labelColor}`}>{title}</div>
      <div className={`text-3xl tabular font-semibold ${valColor}`}>
        {formatCurrency(value)}
      </div>
    </Card>
  );
}

interface DrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string) => void;
  maxAmount: number;
}

function DrawModal({ isOpen, onClose, onSave, maxAmount }: DrawModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSave(parseFloat(amount), date);
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Owner Draw">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs text-gray-900">Move cash from Business to Personal. Available Business Cash: <strong className="text-gray-900 tabular">{formatCurrency(maxAmount)}</strong></div>
        <div><Label>Amount</Label><Input type="number" step="0.01" max={maxAmount} value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <Button type="submit" className="w-full mt-4">Process Draw</Button>
      </form>
    </Modal>
  );
}

