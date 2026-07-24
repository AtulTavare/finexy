import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths } from 'date-fns';

function serviceTotalValue(svc: { price: number; billing: string; startDate: string; endDate?: string }): number {
  if (svc.billing === 'one-time') return svc.price;
  if (!svc.endDate) return svc.price;
  const months = differenceInMonths(new Date(svc.endDate), new Date(svc.startDate)) + 1;
  return svc.price * Math.max(1, months);
}

export default function ClientProjects() {
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
          const paid = businessPayments.filter(bp => bp.projectId === p.id).reduce((s, bp) => s + bp.amount, 0);
          const total = (p.servicePricing || []).reduce((s, svc) => s + serviceTotalValue(svc), 0);
          const pct = total > 0 ? Math.min(paid / total, 1) : 0;
          return (
            <Card key={p.id} className="p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{p.title}</h3>
                <Badge variant={p.status === 'Completed' ? 'success' : p.status === 'In Progress' ? 'warning' : 'secondary'}>{p.status}</Badge>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {format(new Date(p.startDate), 'MMM d')} — {format(new Date(p.deadline), 'MMM d')}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.services.map(s => <Badge key={s} variant="default">{s}</Badge>)}
              </div>
              <div className="space-y-2">
                {p.servicePricing?.map(svc => {
                  const sTotal = serviceTotalValue(svc);
                  const sPaid = businessPayments.filter(bp => bp.projectId === p.id && bp.serviceName === svc.name).reduce((s, bp) => s + bp.amount, 0);
                  const sPct = sTotal > 0 ? Math.min(sPaid / sTotal, 1) : 0;
                  return (
                    <div key={svc.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-700">{svc.name}</span>
                        <span className="text-gray-500">{svc.billing === 'one-time' ? formatCurrency(svc.price) : `${formatCurrency(svc.price)}/mo`}</span>
                      </div>
                      <div className="w-full bg-orange-300/50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-1.5 transition-all" style={{ width: `${sPct * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Overall Progress</span>
                  <span className="text-xs font-semibold text-gray-900">{Math.round(pct * 100)}%</span>
                </div>
                <div className="w-full bg-orange-300/50 rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${pct * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-emerald-600 font-medium">{formatCurrency(paid)} paid</span>
                  <span className="text-gray-400">of {formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
