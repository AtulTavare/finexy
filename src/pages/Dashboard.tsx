import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { format, subMonths, isAfter, startOfMonth, isBefore, addDays, startOfToday, startOfWeek, subWeeks, subDays, startOfDay, differenceInMonths } from 'date-fns';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const data = useData();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  // --- Calculations ---
  const today = startOfToday();

  function serviceTotalValue(svc: { price: number; billing: string; startDate: string; endDate?: string }): number {
    if (svc.billing === 'one-time') return svc.price;
    if (!svc.endDate) return svc.price;
    const months = differenceInMonths(new Date(svc.endDate), new Date(svc.startDate)) + 1;
    return svc.price * Math.max(1, months);
  }

  function serviceActiveMonthly(svc: { billing: string; startDate: string; endDate?: string }): boolean {
    if (svc.billing !== 'monthly') return false;
    const start = new Date(svc.startDate);
    if (start > today) return false;
    if (svc.endDate && new Date(svc.endDate) < today) return false;
    return true;
  }

  const filterStart = useMemo(() => {
    if (timeFilter === 'Daily') return startOfDay(today);
    if (timeFilter === 'Weekly') return startOfWeek(today);
    return startOfMonth(today);
  }, [timeFilter, today]);

  const periodReceivables = data.projects.reduce((sum, p) => {
    const monthlyThisMonth = (p.servicePricing || [])
      .filter(s => serviceActiveMonthly(s))
      .reduce((s, svc) => s + svc.price, 0);
    const oneTimeRemaining = (p.servicePricing || [])
      .filter(s => s.billing === 'one-time' && new Date(s.startDate) <= today)
      .reduce((s, svc) => {
        const paid = data.businessPayments
          .filter(bp => bp.projectId === p.id && bp.serviceName === svc.name)
          .reduce((sum, bp) => sum + bp.amount, 0);
        return s + Math.max(0, svc.price - paid);
      }, 0);
    return sum + Math.max(0, monthlyThisMonth + oneTimeRemaining);
  }, 0);
  const totalBusinessIncome = data.businessPayments.reduce((s, p) => s + p.amount, 0);
  const totalPersonalExpenses = data.personalExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBusinessExpenses = data.businessExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalPersonalExpenses + totalBusinessExpenses;
  const netIncome = totalBusinessIncome - totalExpenses;
  const iOwe = data.personalDebts.filter(d => d.type === 'I Owe' && d.status !== 'Paid').reduce((s, d) => s + d.amount, 0);
  const owedToMe = data.personalDebts.filter(d => d.type === 'Owed to Me' && d.status !== 'Paid').reduce((s, d) => s + d.amount, 0);
  const netDebt = iOwe - owedToMe;
  const periodInc = data.businessPayments.filter(p => isAfter(new Date(p.date), filterStart)).reduce((s,p) => s+p.amount, 0);
  const periodExp = 
    data.personalExpenses.filter(e => isAfter(new Date(e.date), filterStart)).reduce((s,e) => s+e.amount, 0) +
    data.businessExpenses.filter(e => isAfter(new Date(e.date), filterStart)).reduce((s,e) => s+e.amount, 0);
  const periodNet = periodInc - periodExp;

  // Pipeline
  const totalLeadsCount = data.leads.length;
  const wonLeadsCount = data.leads.filter(l => l.stage === 'Won').length;
  const convRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;
  const pipelineValue = data.leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').reduce((s, l) => s + l.estimatedValue, 0);
  const mrr = data.projects.reduce((s, p) => s + (p.servicePricing || []).filter(svc => svc.billing === 'monthly').reduce((sum, svc) => sum + svc.price, 0), 0);

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
      const inc = data.businessPayments.filter(i => new Date(i.date) >= p && new Date(i.date) < nextP).reduce((s,x) => s+x.amount, 0);
      const exp = data.personalExpenses.filter(e => new Date(e.date) >= p && new Date(e.date) < nextP).reduce((s,x) => s+x.amount, 0) + data.businessExpenses.filter(e => new Date(e.date) >= p && new Date(e.date) < nextP).reduce((s,x) => s+x.amount, 0);
      return { 
        name: timeFilter === 'Monthly' ? format(p, 'MMM') : timeFilter === 'Weekly' ? format(p, 'MMM d') : format(p, 'EEE'), 
        Income: inc, 
        Expense: exp 
      };
    });
  }, [timeFilter, today, data]);

  // Expenses by Category
  const expenseCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    data.businessExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    data.personalExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(c => c.value > 0).sort((a,b) => b.value - a.value);
  }, [data.businessExpenses, data.personalExpenses]);

  const COLORS = ['#f97316', '#18181b', '#fb923c', '#3f3f46', '#fdba74', '#71717a'];

  // Needs Attention
  const nextWeek = addDays(today, 7);
  const attentionItems: {id: string, title: string, subtitle: string, date: Date, type: 'task' | 'debt'}[] = [];
  
  data.tasks.filter(t => !t.isCompleted && isBefore(new Date(t.dueDate), nextWeek)).forEach(t => {
    attentionItems.push({ id: t.id, title: t.title, subtitle: `Task (${t.type})`, date: new Date(t.dueDate), type: 'task' });
  });
  data.personalDebts.filter(d => d.status !== 'Paid' && isBefore(new Date(d.dueDate), nextWeek)).forEach(d => {
    const prefix = d.type === 'I Owe' ? 'Owe' : 'Owed';
    attentionItems.push({ id: d.id, title: `${prefix} ${d.partyName}`, subtitle: formatCurrency(d.amount), date: new Date(d.dueDate), type: 'debt' });
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
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
          <Button onClick={() => triggerEvent('open-income-modal', '/personal')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs text-gray-900 shadow-sm"><ArrowUpRight size={14} className="mr-1 inline" /> Income</Button>
          <Button onClick={() => triggerEvent('open-expense-modal', '/personal')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs text-gray-900 shadow-sm"><ArrowDownRight size={14} className="mr-1 inline" /> Expense</Button>
          <Button onClick={() => triggerEvent('open-lead-modal', '/business')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs text-gray-900 shadow-sm"><Briefcase size={14} className="mr-1 inline" /> Lead</Button>
          <Button onClick={() => triggerEvent('open-task-modal', '/tasks')} className="bg-white border-gray-200 hover:bg-gray-50 text-xs text-gray-900 shadow-sm"><PlusCircle size={14} className="mr-1 inline" /> Task</Button>

        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 border-b border-gray-200 pb-4">
        <span className="text-xs font-semibold text-gray-900 mr-1">Filter:</span>
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
        <MetricCard title="Business Income" value={totalBusinessIncome} />
        <MetricCard title={`${timeFilter} Net`} value={periodNet} isPositive={periodNet >= 0} />
        <MetricCard title="Receivables" value={periodReceivables} />
        <MetricCard title="Net Debt" value={netDebt} isDebt />
      </section>

      <Card className="p-4 md:p-6 bg-white">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Receivables by Project</h2>
        {data.projects.filter(p => p.servicePricing?.length > 0).length === 0 ? (
          <p className="text-xs text-gray-400 italic">Set service pricing when adding a project to track receivables.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.projects.filter(p => p.servicePricing?.length > 0).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => {
              const client = data.clients.find(c => c.id === project.clientId);
              const totalBudget = project.servicePricing.reduce((sum, s) => sum + serviceTotalValue(s), 0);
              const paid = data.businessPayments.filter(p => p.projectId === project.id).reduce((s, p) => s + p.amount, 0);
              const remaining = Math.max(0, totalBudget - paid);
              const pct = totalBudget > 0 ? Math.min(paid / totalBudget, 1) : 0;
              return (
                <Card key={project.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold text-sm text-gray-900 truncate">{project.title}</span>
                      {client && <span className="text-xs text-gray-400 truncate">{client.name}</span>}
                    </div>
                    <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'warning' : 'secondary'} className="shrink-0 !text-[9px] !px-1.5">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-orange-300/50 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${pct * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className={remaining > 0 ? 'text-orange-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {formatCurrency(remaining)} {remaining > 0 ? 'remaining' : 'paid'}
                    </span>
                    <span className="text-gray-400">{formatCurrency(paid)} / {formatCurrency(totalBudget)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 md:p-6 bg-white">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 md:mb-6">Cash Flow Over Time</h2>
            <div className="h-48 md:h-64 w-full">
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
            <Card className="p-4 md:p-6 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 md:mb-6">Expenses by Category</h2>
              <div className="h-40 md:h-48 w-full flex items-center justify-center relative">
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
                <div className="text-[10px] md:text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Pipeline Value</div>
                <div className="text-lg md:text-2xl tabular font-semibold">{formatCurrency(pipelineValue)}</div>
                <div className="text-[10px] md:text-xs text-gray-800 mt-1 font-semibold">{convRate}% Conv. Rate</div>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <div className="text-[10px] md:text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Active MRR</div>
                <div className="text-lg md:text-2xl tabular text-green-700 font-semibold">{formatCurrency(mrr)}</div>
                <div className="text-[10px] md:text-xs text-gray-800 mt-1 font-semibold">From Retainers</div>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <div className="text-[10px] md:text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Personal Expenses</div>
                <div className="text-lg md:text-2xl tabular text-red-500 font-semibold">{formatCurrency(totalPersonalExpenses)}</div>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <div className="text-[10px] md:text-xs uppercase text-gray-900 font-semibold mb-1 tracking-widest">Business Expenses</div>
                <div className="text-lg md:text-2xl tabular text-red-500 font-semibold">{formatCurrency(totalBusinessExpenses)}</div>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-4 md:p-6 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Debt Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">I Owe</span>
                  <span className="text-sm tabular font-semibold text-red-500">{formatCurrency(iOwe)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Owed to Me</span>
                  <span className="text-sm tabular font-semibold text-emerald-500">{formatCurrency(owedToMe)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-900">Net Debt</span>
                  <span className="text-sm tabular font-semibold">{formatCurrency(netDebt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-0 flex flex-col max-h-[300px] md:max-h-[500px] bg-white">
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
      
    </div>
  );
}

function MetricCard({ title, value, isPositive, isDebt }: { title: string, value: number, isPositive?: boolean, isDebt?: boolean }) {
  const color = isDebt ? (value > 0 ? 'text-red-500' : 'text-emerald-500') : (isPositive === true ? 'text-emerald-500' : isPositive === false ? 'text-red-500' : 'text-gray-900');
  const bgColor = isPositive === true ? "bg-[#f97316] text-white" : "bg-white text-gray-900";
  const labelColor = isPositive === true ? "text-orange-100" : "text-gray-500";
  const valColor = isPositive === true ? "text-white" : color;
  
  return (
    <Card className={`p-4 md:p-6 flex flex-col justify-center ${bgColor}`}>
      <div className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${labelColor}`}>{title}</div>
      <div className={`text-xl md:text-3xl tabular font-semibold ${valColor}`}>
        {formatCurrency(value)}
      </div>
    </Card>
  );
}

