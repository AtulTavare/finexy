import { useClientData } from '../../store/ClientDataContext';
import { Card } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export default function ClientPayments() {
  const { businessPayments, loading } = useClientData();

  const total = businessPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500 mt-1">All payments received by Infinity Innovations.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Total Paid</div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(total)}</div>
        </div>
      </div>

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
        <Card className="p-0 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                <th className="p-4 md:p-6 font-semibold">Date</th>
                <th className="p-4 md:p-6 font-semibold">Service</th>
                <th className="p-4 md:p-6 font-semibold hidden sm:table-cell">Invoice Ref</th>
                <th className="p-4 md:p-6 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {businessPayments.map(p => (
                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 md:p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                  <td className="p-4 md:p-6"><span className="text-gray-900">{p.serviceName}</span></td>
                  <td className="p-4 md:p-6 text-gray-500 hidden sm:table-cell">{p.invoiceReference || '—'}</td>
                  <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}