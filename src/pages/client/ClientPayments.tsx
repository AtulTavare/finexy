import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import type { ServicePricing, BusinessPayment, Installment } from '../../types';

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

export default function ClientPayments() {
  const { projects, businessPayments, installments, loading } = useClientData();

  const total = businessPayments.reduce((s, p) => s + p.amount, 0);

  let currentMonthDue = 0;
  let totalOverdue = 0;
  for (const p of projects) {
    for (const svc of p.servicePricing || []) {
      const r = getServiceCurrentMonthDue(svc, businessPayments, p.id);
      currentMonthDue += r.currentMonthDue;
      totalOverdue += r.overdue;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">All payments received by Infinity Innovations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-white">
          <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1 tracking-widest">Current Month Due</div>
          <div className="text-xl font-bold text-orange-600">
            {currentMonthDue > 0 ? formatCurrency(currentMonthDue) : '—'}
          </div>
          {totalOverdue > currentMonthDue && (
            <div className="text-[10px] text-red-500 mt-0.5">+{formatCurrency(totalOverdue - currentMonthDue)} overdue</div>
          )}
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1 tracking-widest">Total Paid (Lifetime)</div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(total)}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1 tracking-widest">Total Outstanding</div>
          <div className="text-xl font-bold text-red-600">{totalOverdue > 0 ? formatCurrency(totalOverdue) : '—'}</div>
        </Card>
      </div>

      {currentMonthDue > 0 && (
        <Card className="p-4 md:p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Breakdown — Due This Month</h2>
          <div className="space-y-2">
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
          </div>
        </Card>
      )}

      {installments.length > 0 && (
        <Card className="p-4 md:p-5 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Payment Schedule</h2>
          </div>
          <div className="space-y-2">
            {[...installments]
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(inst => {
                const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date();
                const status = isOverdue ? 'overdue' : inst.status;
                const project = projects.find(p => p.id === inst.projectId);
                return (
                  <div key={inst.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${status === 'paid' ? 'bg-emerald-400' : status === 'overdue' ? 'bg-red-400' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900">{inst.serviceName}</span>
                        <span className="text-xs text-gray-500 ml-1">{project?.title}</span>
                        <div className="text-[10px] text-gray-400">
                          Due {format(new Date(inst.dueDate), 'MMM d, yyyy')}
                          {inst.paidDate && ` — Paid ${format(new Date(inst.paidDate), 'MMM d, yyyy')}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-sm tabular font-semibold text-gray-900">{formatCurrency(inst.amount)}</span>
                      <Badge variant={status === 'paid' ? 'success' : status === 'overdue' ? 'error' : 'secondary'}>{status}</Badge>
                    </div>
                  </div>
                );
              })}
          </div>
          <button
            onClick={() => window.open('/client/calendar', '_self')}
            className="mt-3 text-xs text-orange-600 font-medium flex items-center gap-1 hover:underline"
          >
            <CalendarDays size={12} /> View in Calendar
          </button>
        </Card>
      )}

      {loading ? (
        <div className="text-gray-400 italic text-sm">Loading payments...</div>
      ) : businessPayments.length === 0 ? (
        <Card className="p-6 bg-white">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No payments yet</h3>
            <p className="text-xs text-gray-500 max-w-xs">Payments will appear here once they are recorded against your projects.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                <th className="p-4 md:p-6 font-semibold">Date</th>
                <th className="p-4 md:p-6 font-semibold">Service</th>
                <th className="p-4 md:p-6 font-semibold hidden sm:table-cell">Project</th>
                <th className="p-4 md:p-6 font-semibold hidden sm:table-cell">Invoice Ref</th>
                <th className="p-4 md:p-6 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {businessPayments.map(p => (
                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 md:p-6 text-gray-900 whitespace-nowrap">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                  <td className="p-4 md:p-6"><span className="text-gray-900">{p.serviceName}</span></td>
                  <td className="p-4 md:p-6 text-gray-500 hidden sm:table-cell">{projects.find(pr => pr.id === p.projectId)?.title || '—'}</td>
                  <td className="p-4 md:p-6 text-gray-500 hidden sm:table-cell">{p.invoiceReference || '—'}</td>
                  <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold whitespace-nowrap">+{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
