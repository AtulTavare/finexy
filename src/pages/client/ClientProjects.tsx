import { useNavigate } from 'react-router-dom';
import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { CircleDot } from 'lucide-react';
import type { Milestone, ServicePricing, BusinessPayment } from '../../types';

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

function currentMilestone(milestones: Milestone[]): Milestone | null {
  const ip = milestones.find(m => m.status === 'In Progress');
  if (ip) return ip;
  return milestones.find(m => m.status === 'Pending') || null;
}

export default function ClientProjects() {
  const navigate = useNavigate();
  const { projects, businessPayments } = useClientData();

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Your Projects</h1>
        <p className="text-gray-400 italic">No projects assigned to your account yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Your Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(p => {
          const milestones = p.milestones || [];
          const milestonePct = milestones.length > 0
            ? Math.round((milestones.filter(m => m.status === 'Completed').length / milestones.length) * 100)
            : 0;

          let currentMonthDue = 0;
          let monthlyCommitment = 0;
          for (const svc of p.servicePricing || []) {
            const r = getServiceCurrentMonthDue(svc, businessPayments, p.id);
            currentMonthDue += r.currentMonthDue;
            if (svc.billing === 'monthly') monthlyCommitment += svc.price;
          }

          return (
            <Card key={p.id} className="p-4 bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/client/projects/${p.id}`)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{p.title}</h3>
                <Badge variant={p.status === 'Completed' ? 'success' : p.status === 'In Progress' ? 'warning' : 'secondary'}>{p.status}</Badge>
              </div>
              {(() => {
                const cm = currentMilestone(milestones);
                return cm ? (
                  <div className="flex items-center gap-1 mb-2">
                    <CircleDot size={12} className="text-orange-500 shrink-0" />
                    <span className="text-[10px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      {cm.status === 'In Progress' ? '' : 'Next: '}{cm.title}
                    </span>
                  </div>
                ) : null;
              })()}
              <div className="text-xs text-gray-500 mb-3">
                {format(new Date(p.startDate), 'MMM d')} — {format(new Date(p.deadline), 'MMM d')}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.services.map(s => <Badge key={s} variant="default">{s}</Badge>)}
              </div>
              {(milestones).length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {milestones.map((m, i) => {
                    const isCompleted = m.status === 'Completed';
                    const isInProgress = m.status === 'In Progress';
                    return (
                      <div key={i} className="flex items-center gap-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-orange-400 animate-pulse' : 'bg-gray-200'}`} title={m.title} />
                        {i < milestones.length - 1 && <div className={`w-5 h-0.5 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                      </div>
                    );
                  })}
                  <span className="text-[9px] text-gray-400 ml-0.5">
                    {milestones.filter(m => m.status === 'Completed').length}/{milestones.length}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {(p.servicePricing || []).map(svc => {
                  const r = getServiceCurrentMonthDue(svc, businessPayments, p.id);
                  return (
                    <div key={svc.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-700">{svc.name}</span>
                        <span className="text-gray-500">{svc.billing === 'one-time' ? formatCurrency(svc.price) : `${formatCurrency(svc.price)}/mo`}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className={r.currentMonthDue === 0 ? 'text-emerald-600' : 'text-orange-600'}>
                          {r.currentMonthDue === 0 ? '✓ This month paid' : `${formatCurrency(r.currentMonthDue)} due`}
                        </span>
                        {r.overdue > r.currentMonthDue && (
                          <span className="text-red-500">+{formatCurrency(r.overdue - r.currentMonthDue)} overdue</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {milestones.length > 0 ? 'Milestone Progress' : monthlyCommitment > 0 ? 'Monthly Commitment' : 'Budget'}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {milestones.length > 0 ? `${milestonePct}%` : monthlyCommitment > 0 ? formatCurrency(monthlyCommitment) + '/mo' : ''}
                  </span>
                </div>
                {milestones.length > 0 && (
                  <>
                    <div className="w-full bg-orange-300/50 rounded-full h-2 overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${milestonePct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-emerald-600 font-medium">{milestones.filter(m => m.status === 'Completed').length}/{milestones.length} done</span>
                      <span className="text-gray-400">{milestonePct}%</span>
                    </div>
                  </>
                )}
                {currentMonthDue > 0 && (
                  <div className="text-[10px] text-orange-600 font-medium mt-1">
                    {formatCurrency(currentMonthDue)} due this month
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
