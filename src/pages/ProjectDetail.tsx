import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Badge, ConfirmDialog } from '../components/ui';
import { ProjectModal, PaymentModal } from '../components/modals';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    projects, addProject, updateProject, deleteProject,
    clients, engagements, businessPayments,
    addBusinessPayment, updateBusinessPayment, deleteBusinessPayment,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense
  } = useData();

  const project = projects.find(p => p.id === id);
  const client = project ? clients.find(c => c.id === project.clientId) : null;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Project not found</h2>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const projectEngs = engagements.filter(e => e.projectId === project.id && e.status === 'Active');
  const totalBudget = project.servicePricing.reduce((sum, s) => sum + s.price, 0);
  const totalPaid = projectEngs.reduce((sum, eng) => sum + businessPayments.filter(p => p.engagementId === eng.id).reduce((s, p) => s + p.amount, 0), 0);
  const remaining = Math.max(0, totalBudget - totalPaid);
  const pct = totalBudget > 0 ? Math.min(totalPaid / totalBudget, 1) : 0;

  const projectPaymentIds = projectEngs.map(e => e.id);
  const projectPayments = businessPayments.filter(p => projectPaymentIds.includes(p.engagementId));

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/projects', { replace: true });
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 w-fit">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{project.title}</h1>
          <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'warning' : 'secondary'}>{project.status}</Badge>
          {client && <span className="text-sm text-gray-500">— {client.name}</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>Edit</Button>
          <Button variant="danger" onClick={() => setDeleteTarget({ id: project.id, name: project.title })}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Budget</div>
          <div className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Collected</div>
          <div className="text-lg md:text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Remaining</div>
          <div className="text-lg md:text-xl font-bold text-orange-600">{formatCurrency(remaining)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Progress</div>
          <div className="text-lg md:text-xl font-bold text-gray-900">{Math.round(pct * 100)}%</div>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Overall Progress</h2>
          <div className="text-xs text-gray-500">{format(new Date(project.startDate), 'MMM d')} — {format(new Date(project.deadline), 'MMM d')}</div>
        </div>
        <div className="w-full bg-orange-300/50 rounded-full h-3 overflow-hidden flex">
          <div className="bg-emerald-500 h-3 transition-all" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-emerald-600 font-semibold">{formatCurrency(totalPaid)} collected</span>
          <span className={remaining > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}>
            {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Fully paid'}
          </span>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Services</h2>
        <div className="space-y-4">
          {project.servicePricing.map(svc => {
            const eng = projectEngs.find(e => e.serviceName === svc.name);
            const paid = eng ? businessPayments.filter(p => p.engagementId === eng.id).reduce((s, p) => s + p.amount, 0) : 0;
            const sPct = svc.price > 0 ? Math.min(paid / svc.price, 1) : 0;
            const started = new Date(svc.startDate) <= new Date();
            return (
              <div key={svc.name} className="border border-gray-100 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold text-sm text-gray-900">{svc.name}</span>
                    <Badge className="ml-2">{svc.billing === 'one-time' ? 'One-time' : 'Monthly'}</Badge>
                    {!started && <Badge className="ml-1" variant="warning">Starts {format(new Date(svc.startDate), 'MMM d')}</Badge>}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {svc.billing === 'one-time' ? formatCurrency(svc.price) : `${formatCurrency(svc.price)}/mo`}
                  </span>
                </div>
                {started && (
                  <>
                    <div className="w-full bg-orange-300/50 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${sPct * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] mt-1">
                      <span className="text-emerald-600 font-medium">{formatCurrency(paid)} collected</span>
                      <span className="text-gray-500">{Math.round(sPct * 100)}%</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {project.servicePricing.length === 0 && (
            <p className="text-sm text-gray-400 italic">No services configured for this project.</p>
          )}
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Payment History</h2>
          <Button onClick={() => setShowPaymentModal(true)} variant="secondary" className="text-xs px-3 py-1.5">
            <Plus size={14} className="mr-1" /> Log Payment
          </Button>
        </div>
        {projectPayments.length === 0 ? (
          <div className="p-4 md:p-6 text-sm text-gray-400 italic">No payments recorded yet for this project.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                <th className="p-4 md:p-6 font-semibold">Date</th>
                <th className="p-4 md:p-6 font-semibold">Service</th>
                <th className="p-4 md:p-6 font-semibold hidden sm:table-cell">Invoice Ref</th>
                <th className="p-4 md:p-6 font-semibold text-right">Amount</th>
                <th className="p-4 md:p-6"></th>
              </tr>
            </thead>
            <tbody>
              {projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => {
                const eng = engagements.find(e => e.id === p.engagementId);
                return (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 md:p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                    <td className="p-4 md:p-6">
                      <span className="text-gray-900">{eng?.serviceName || '—'}</span>
                    </td>
                    <td className="p-4 md:p-6 text-gray-500 hidden sm:table-cell">{p.invoiceReference || '—'}</td>
                    <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                    <td className="p-4 md:p-6 text-right">
                      <button onClick={() => deleteBusinessPayment(p.id)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <ProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={addProject}
        onUpdate={updateProject}
        clients={clients}
        editItem={project}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSaveIncoming={addBusinessPayment}
        onUpdateIncoming={updateBusinessPayment}
        onSaveOutgoing={addBusinessExpense}
        onUpdateOutgoing={updateBusinessExpense}
        clients={client ? [client] : clients}
        engagements={engagements}
        payments={businessPayments}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also mark its linked engagements as completed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
