import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export default function ClientPayments() {
  const { businessPayments } = useClientData();

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

      <Card className="p-0 bg-white">
        {businessPayments.length === 0 ? (
          <div className="p-6 text-sm text-gray-400 italic">No payments recorded yet.</div>
        ) : (
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
        )}
      </Card>
    </div>
  );
}
