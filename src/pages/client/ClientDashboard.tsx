import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { ArrowUpRight, FolderKanban, FileText, CreditCard } from 'lucide-react';

function serviceTotalValue(svc: { price: number; billing: string; startDate: string; endDate?: string }): number {
  if (svc.billing === 'one-time') return svc.price;
  if (!svc.endDate) return svc.price;
  const months = differenceInMonths(new Date(svc.endDate), new Date(svc.startDate)) + 1;
  return svc.price * Math.max(1, months);
}

export default function ClientDashboard() {
  const { client, projects, businessPayments, documents, loading } = useClientData();

  if (loading) {
    return <div className="text-gray-400 italic">Loading your dashboard...</div>;
  }

  if (!client) {
    return <div className="text-gray-900 font-semibold">Could not load client data.</div>;
  }

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const totalPaid = businessPayments.reduce((s, p) => s + p.amount, 0);
  const totalBudget = projects.reduce((s, p) => s + (p.servicePricing || []).reduce((sum, svc) => sum + serviceTotalValue(svc), 0), 0);
  const outstanding = Math.max(0, totalBudget - totalPaid);
  const recentPayments = businessPayments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome, {client.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Here's an overview of your projects with Infinity Innovations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-center bg-white">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Active Projects</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-gray-900">{activeProjects.length}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Total Paid</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Outstanding</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-orange-600">{formatCurrency(outstanding)}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white">
          <div className="text-[10px] md:text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Documents</div>
          <div className="text-xl md:text-3xl tabular font-semibold text-gray-900">{documents.length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 md:p-6 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Payments</h2>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.serviceName}</div>
                    <div className="text-[10px] text-gray-500">{format(new Date(p.date), 'MMM d, yyyy')}</div>
                  </div>
                  <span className="text-sm tabular text-emerald-600 font-semibold">+{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 md:p-6 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-3">
            <a href="/client/projects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0"><FolderKanban size={20} className="text-orange-600" /></div>
              <div className="flex-1"><div className="text-sm font-semibold text-gray-900">View Projects</div><div className="text-[10px] text-gray-500">{activeProjects.length} active</div></div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </a>
            <a href="/client/payments" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><CreditCard size={20} className="text-emerald-600" /></div>
              <div className="flex-1"><div className="text-sm font-semibold text-gray-900">Payment History</div><div className="text-[10px] text-gray-500">{businessPayments.length} entries</div></div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </a>
            <a href="/client/documents" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><FileText size={20} className="text-blue-600" /></div>
              <div className="flex-1"><div className="text-sm font-semibold text-gray-900">Documents</div><div className="text-[10px] text-gray-500">{documents.length} files</div></div>
              <ArrowUpRight size={16} className="text-gray-400" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
