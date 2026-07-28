import { useNavigate } from 'react-router-dom';
import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths, startOfMonth, isSameDay, parseISO } from 'date-fns';
import {
  FolderKanban, FileText, CreditCard, ArrowUpRight, Calendar,
  CircleDashed, CircleDot, CheckCircle2, ChevronRight, Bell
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip, Legend,
} from 'recharts';
import type { ServicePricing, BusinessPayment, Milestone, Installment } from '../../types';

const MILESTONE_COLORS = { Completed: '#10b981', 'In Progress': '#f97316', Pending: '#d1d5db' };

function getServiceCurrentMonthDue(
  svc: ServicePricing,
  payments: BusinessPayment[],
  projectId: string,
): { currentMonthDue: number; overdue: number } {
  const svcPayments = payments.filter(p => p.projectId === projectId && p.serviceName === svc.name);
  const totalPaid = svcPayments.reduce((s, p) => s + p.amount, 0);
  const now = new Date();

  if (svc.billing === 'one-time') {
    const remaining = Math.max(0, svc.price - totalPaid);
    return { currentMonthDue: remaining, overdue: 0 };
  }

  const start = new Date(svc.startDate);
  if (start > now) return { currentMonthDue: 0, overdue: 0 };

  const end = svc.endDate ? new Date(svc.endDate) : null;
  const effectiveEnd = end && end < now ? end : now;
  const monthsElapsed = differenceInMonths(effectiveEnd, start) + 1;
  const expected = Math.max(1, monthsElapsed) * svc.price;
  const overdue = Math.max(0, expected - totalPaid);

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  const currentMonthPaid = svcPayments.some(p => {
    const d = new Date(p.date);
    return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}` === currentMonthKey;
  });

  return {
    currentMonthDue: currentMonthPaid ? 0 : svc.price,
    overdue,
  };
}

function getCurrentMilestone(milestones: Milestone[]): Milestone | null {
  const ip = milestones.find(m => m.status === 'In Progress');
  if (ip) return ip;
  return milestones.find(m => m.status === 'Pending') || null;
}

function milestoneStats(ms: Milestone[]) {
  const total = ms.length;
  const completed = ms.filter(m => m.status === 'Completed').length;
  const inProgress = ms.filter(m => m.status === 'In Progress').length;
  return {
    total,
    completed,
    inProgress,
    pending: total - completed - inProgress,
    pct: total ? Math.round((completed / total) * 100) : 0,
  };
}

function monthlyPaymentsData(payments: BusinessPayment[]) {
  const byMonth: Record<string, number> = {};
  for (const p of payments) {
    const key = format(startOfMonth(new Date(p.date)), 'MMM yy');
    byMonth[key] = (byMonth[key] || 0) + p.amount;
  }
  const months = Object.keys(byMonth).sort((a, b) => {
    const [aM, aY] = a.split(' ');
    const [bM, bY] = b.split(' ');
    return new Date(`${aM} 1, 20${aY}`).getTime() - new Date(`${bM} 1, 20${bY}`).getTime();
  });
  return months.slice(-12).map(name => ({ name, amount: byMonth[name] }));
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, projects, businessPayments, documents, meetings, installments, loading } = useClientData();

  if (loading) {
    return <div className="text-gray-400 italic">Loading your dashboard...</div>;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-gray-500 max-w-sm">Your account does not have permission to view this dashboard. Please contact Infinity Innovations support.</p>
      </div>
    );
  }

  const hasData = projects.length > 0 || businessPayments.length > 0 || documents.length > 0;
  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const totalPaid = businessPayments.reduce((s, p) => s + p.amount, 0);

  let currentMonthDue = 0;
  let totalOverdue = 0;
  for (const p of projects) {
    for (const svc of p.servicePricing || []) {
      const r = getServiceCurrentMonthDue(svc, businessPayments, p.id);
      currentMonthDue += r.currentMonthDue;
      totalOverdue += r.overdue;
    }
  }

  const paymentChartData = monthlyPaymentsData(businessPayments);

  const now = new Date();
  const upcomingMeetings = meetings
    .filter(m => parseISO(m.date) >= now)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 3);
  const todayMeetings = meetings.filter(m => isSameDay(parseISO(m.date), now));
  const pendingInstallments = installments
    .filter(i => i.status === 'pending' && new Date(i.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  const overdueInstallments = installments.filter(i => {
    const isOverdue = i.status === 'pending' && new Date(i.dueDate) < now;
    return isOverdue;
  }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome, {client.userName}</h1>
        <p className="text-sm text-gray-500 mt-1">Here's an overview of your projects with Infinity Innovations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 flex flex-col justify-center bg-white min-h-[88px]">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Active Projects</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-gray-900">{activeProjects.length}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white min-h-[88px]">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Due This Month</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-orange-600">
            {currentMonthDue > 0 ? formatCurrency(currentMonthDue) : '—'}
          </div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white min-h-[88px]">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Total Paid</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white min-h-[88px]">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Documents</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-gray-900">{documents.length}</div>
        </Card>
      </div>

      {!hasData ? (
        <Card className="p-8 bg-white">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <FolderKanban size={28} className="text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your dashboard is ready</h2>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              As the admin adds projects, tracks payments, and shares documents, everything will appear here in real time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
              <div className="border border-gray-100 rounded-xl p-4 text-left">
                <FolderKanban size={20} className="text-gray-400 mb-2" />
                <div className="text-xs font-semibold text-gray-900">Projects</div>
                <div className="text-[10px] text-gray-500">Track scope, timeline, and progress</div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 text-left">
                <CreditCard size={20} className="text-gray-400 mb-2" />
                <div className="text-xs font-semibold text-gray-900">Payments</div>
                <div className="text-[10px] text-gray-500">View invoices and payment history</div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 text-left">
                <FileText size={20} className="text-gray-400 mb-2" />
                <div className="text-xs font-semibold text-gray-900">Documents</div>
                <div className="text-[10px] text-gray-500">Access shared files and reports</div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {activeProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Active Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProjects.map(project => {
                  const milestones = project.milestones || [];
                  const steps = project.processSteps || [];
                  const currentMilestone = getCurrentMilestone(milestones);
                  const stats = milestoneStats(milestones);
                  const pieData = [
                    { name: 'Completed', value: stats.completed || 0, color: MILESTONE_COLORS.Completed },
                    { name: 'In Progress', value: stats.inProgress || 0, color: MILESTONE_COLORS['In Progress'] },
                    { name: 'Pending', value: stats.pending || 0, color: MILESTONE_COLORS.Pending },
                  ].filter(d => d.value > 0);

                  return (
                    <Card
                      key={project.id}
                      className="p-4 md:p-5 bg-white cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/client/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">{project.title}</h3>
                          {currentMilestone && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                              <CircleDot size={10} />
                              {currentMilestone.status === 'In Progress' ? '' : 'Next: '}{currentMilestone.title}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'warning' : 'secondary'}
                          className="shrink-0 ml-2"
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        {milestones.length > 0 && (
                          <div className="shrink-0">
                            <ResponsiveContainer width={64} height={64}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%" cy="50%"
                                  innerRadius={20} outerRadius={30}
                                  dataKey="value"
                                  stroke="transparent"
                                  startAngle={90} endAngle={-270}
                                >
                                  {pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          {milestones.length > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-gray-900">{stats.pct}%</span>
                              <span className="text-[10px] text-gray-500">
                                {stats.completed}/{stats.total} milestones
                                {stats.inProgress > 0 && ` (${stats.inProgress} in progress)`}
                              </span>
                            </div>
                          )}

                          {milestones.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              {milestones.map((m, i) => (
                                <div key={i} className="flex items-center gap-0">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                      m.status === 'Completed' ? 'bg-emerald-500' :
                                      m.status === 'In Progress' ? 'bg-orange-400 animate-pulse' :
                                      'bg-gray-200'
                                    }`}
                                    title={m.title}
                                  />
                                  {i < milestones.length - 1 && (
                                    <div className={`w-4 h-0.5 ${m.status === 'Completed' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {steps.length > 0 && (
                        <div className="mt-3">
                          {steps.sort((a, b) => a.order - b.order).slice(0, 2).map((step, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                step.status === 'Completed' ? 'bg-emerald-400' :
                                step.status === 'In Progress' ? 'bg-orange-400' :
                                'bg-gray-300'
                              }`} />
                              <span className="text-[10px] text-gray-600 truncate">{step.title}</span>
                              <span className={`text-[8px] font-medium px-1 py-0.5 rounded-full shrink-0 ${
                                step.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                step.status === 'In Progress' ? 'bg-orange-50 text-orange-600' :
                                'bg-gray-100 text-gray-500'
                              }`}>{step.status}</span>
                            </div>
                          ))}
                          {steps.length > 2 && (
                            <div className="text-[9px] text-orange-600 font-medium mt-0.5 flex items-center gap-1">
                              +{steps.length - 2} more steps <ChevronRight size={10} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">{format(new Date(project.startDate), 'MMM d')} — {format(new Date(project.deadline), 'MMM d')}</span>
                          {milestones.length > 0 && (
                            <span className="font-medium text-gray-900">{stats.pct}% complete</span>
                          )}
                        </div>
                        {milestones.length > 0 && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1 flex">
                            {stats.completed > 0 && (
                              <div className="bg-emerald-500 h-1.5 transition-all" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                            )}
                            {stats.inProgress > 0 && (
                              <div className="bg-orange-400 h-1.5 transition-all" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Milestone Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProjects.map(project => {
                  const milestones = project.milestones || [];
                  const stats = milestoneStats(milestones);
                  const pieData = [
                    { name: 'Completed', value: stats.completed || 0, color: MILESTONE_COLORS.Completed },
                    { name: 'In Progress', value: stats.inProgress || 0, color: MILESTONE_COLORS['In Progress'] },
                    { name: 'Pending', value: stats.pending || 0, color: MILESTONE_COLORS.Pending },
                  ].filter(d => d.value > 0);

                  const sorted = [...milestones].sort((a, b) => {
                    const order = { Completed: 3, 'In Progress': 1, Pending: 2 };
                    return (order[a.status] || 9) - (order[b.status] || 9);
                  });

                  return (
                    <Card key={project.id} className="p-4 md:p-5 bg-white">
                      <h3 className="font-semibold text-sm text-gray-900 mb-4">{project.title}</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {milestones.length > 0 && (
                          <div className="relative shrink-0">
                            <ResponsiveContainer width={120} height={120}>
                              <PieChart>
                                <Pie
                                  data={pieData.length > 0 ? pieData : [{ name: 'No milestones', value: 1, color: '#e5e7eb' }]}
                                  cx="50%" cy="50%"
                                  innerRadius={36} outerRadius={56}
                                  dataKey="value"
                                  stroke="transparent"
                                  startAngle={90} endAngle={-270}
                                >
                                  {pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-lg font-bold text-gray-900">{stats.pct}%</span>
                            </div>
                          </div>
                        )}

                        <div className="flex-1 w-full min-w-0 space-y-1.5">
                          {stats.total > 0 && (
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.completed} Completed</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> {stats.inProgress} In Progress</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200" /> {stats.pending} Pending</span>
                            </div>
                          )}
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                            {stats.completed > 0 && <div className="bg-emerald-500 h-2" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />}
                            {stats.inProgress > 0 && <div className="bg-orange-400 h-2" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />}
                          </div>
                          <div className="space-y-1 mt-2">
                            {sorted.slice(0, 5).map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {m.status === 'Completed' ? (
                                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                ) : m.status === 'In Progress' ? (
                                  <CircleDot size={12} className="text-orange-400 shrink-0" />
                                ) : (
                                  <CircleDashed size={12} className="text-gray-300 shrink-0" />
                                )}
                                <span className={`text-[10px] truncate ${m.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                  {m.title}
                                </span>
                                <span className={`text-[8px] font-medium px-1 py-0.5 rounded-full shrink-0 ml-auto ${
                                  m.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                  m.status === 'In Progress' ? 'bg-orange-50 text-orange-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{m.status}</span>
                              </div>
                            ))}
                            {milestones.length > 5 && (
                              <div className="text-[9px] text-orange-600 font-medium flex items-center gap-1">
                                +{milestones.length - 5} more <ChevronRight size={10} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 md:p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment Activity</h2>
              {paymentChartData.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <CreditCard size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">No payments yet</p>
                </div>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentChartData}>
                      <XAxis dataKey="name" stroke="transparent" fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        itemStyle={{ fontSize: '12px', color: '#374151' }}
                        formatter={(value: number) => [formatCurrency(value), 'Paid']}
                        cursor={{ fill: '#fef3c7' }}
                      />
                      <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} stroke="transparent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-4 md:p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Due This Month</h2>
              {currentMonthDue === 0 && totalOverdue === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">All caught up!</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">No pending payments for this month.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map(p =>
                    (p.servicePricing || []).map(svc => {
                      const r = getServiceCurrentMonthDue(svc, businessPayments, p.id);
                      if (r.currentMonthDue === 0 && r.overdue === 0) return null;
                      return (
                        <div key={`${p.id}-${svc.name}`} className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{svc.name}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                              <span className="truncate">{p.title}</span>
                              <Badge className="text-[8px]">{svc.billing === 'one-time' ? 'One-time' : 'Monthly'}</Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="text-sm tabular font-semibold text-orange-600">{formatCurrency(r.currentMonthDue)}</div>
                            {r.overdue > r.currentMonthDue && (
                              <div className="text-[9px] tabular text-red-500">+{formatCurrency(r.overdue - r.currentMonthDue)} overdue</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {totalOverdue > currentMonthDue && totalOverdue > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-900">Total Outstanding</span>
                      <span className="text-sm tabular font-semibold text-red-600">{formatCurrency(totalOverdue)}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {(todayMeetings.length > 0 || upcomingMeetings.length > 0) && (
            <Card className="p-4 md:p-5 bg-white border-l-4 border-orange-400">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-900">Upcoming Meetings</h2>
              </div>
              <div className="space-y-2">
                {todayMeetings.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{m.title}</span>
                      <span className="text-xs text-gray-500 ml-2">Today at {m.time}</span>
                      {m.reason && <span className="text-xs text-gray-400 ml-2">— {m.reason}</span>}
                    </div>
                  </div>
                ))}
                {upcomingMeetings.filter(m => !todayMeetings.some(t => t.id === m.id)).map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{m.title}</span>
                      <span className="text-xs text-gray-500 ml-2">{format(parseISO(m.date), 'MMM d')} at {m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(pendingInstallments.length > 0 || overdueInstallments.length > 0) && (
            <Card className="p-4 md:p-5 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Installments</h2>
              <div className="space-y-2">
                {overdueInstallments.map(inst => {
                  const project = projects.find(p => p.id === inst.projectId);
                  return (
                    <div key={inst.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-900 truncate">{inst.serviceName}</span>
                          <span className="text-[10px] text-gray-500 ml-1">{project?.title}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs tabular font-semibold text-red-600">{formatCurrency(inst.amount)}</div>
                        <div className="text-[9px] text-red-500">Overdue</div>
                      </div>
                    </div>
                  );
                })}
                {pendingInstallments.map(inst => {
                  const project = projects.find(p => p.id === inst.projectId);
                  return (
                    <div key={inst.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-900 truncate">{inst.serviceName}</span>
                          <span className="text-[10px] text-gray-500 ml-1">{project?.title}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs tabular font-semibold text-gray-900">{formatCurrency(inst.amount)}</div>
                        <div className="text-[9px] text-gray-400">Due {format(new Date(inst.dueDate), 'MMM d')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-4 md:p-5 bg-white">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/client/projects')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0"><FolderKanban size={20} className="text-orange-600" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900">Projects</div><div className="text-[10px] text-gray-500">{activeProjects.length} active</div></div>
                <ArrowUpRight size={16} className="text-gray-400 shrink-0" />
              </button>
              <button
                onClick={() => navigate('/client/payments')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><CreditCard size={20} className="text-emerald-600" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900">Payments</div><div className="text-[10px] text-gray-500">{businessPayments.length} entries</div></div>
                <ArrowUpRight size={16} className="text-gray-400 shrink-0" />
              </button>
              <button
                onClick={() => navigate('/client/documents')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><FileText size={20} className="text-blue-600" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900">Documents</div><div className="text-[10px] text-gray-500">{documents.length} files</div></div>
                <ArrowUpRight size={16} className="text-gray-400 shrink-0" />
              </button>
              <button
                onClick={() => navigate('/client/about')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0"><Calendar size={20} className="text-purple-600" /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900">About Us</div><div className="text-[10px] text-gray-500">Contact & information</div></div>
                <ArrowUpRight size={16} className="text-gray-400 shrink-0" />
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
