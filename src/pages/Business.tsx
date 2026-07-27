import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Select, Label, Modal, Badge, DatePicker, ConfirmDialog } from '../components/ui';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { formatCurrency } from '../lib/utils';
import { Brand, Lead, Client, BusinessPayment, BusinessExpense, Project, Installment } from '../types';
import { format } from 'date-fns';
import { Trash2, User, Camera } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { PaymentModal } from '../components/modals';

const BRANDS: (Brand | 'All')[] = ['All', 'Infinity Innovations'];

export default function Business() {
  const [activeBrand, setActiveBrand] = useState<Brand | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'clients' | 'payments' | 'expenses' | 'installments'>('pipeline');
  const { 
    leads, addLead, updateLead, deleteLead,
    clients, addClient, updateClient, deleteClient,
    businessPayments, addBusinessPayment, updateBusinessPayment, deleteBusinessPayment,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
    projects, installments, addInstallment, updateInstallment, deleteInstallment,
  } = useData();
  const { user } = useAuth();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingPayment, setEditingPayment] = useState<BusinessPayment | null>(null);
  const [editingExpense, setEditingExpense] = useState<BusinessExpense | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [showPaidInstallmentModal, setShowPaidInstallmentModal] = useState<Installment | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date());
  const [paidInvoiceRef, setPaidInvoiceRef] = useState('');

  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal) {
      const modal = location.state.openModal;
      if (modal === 'open-lead-modal') {
        setActiveTab('pipeline');
        setShowLeadModal(true);
      } else if (modal === 'open-payment-modal') {
        setActiveTab('payments');
        setShowPaymentModal(true);
      } else if (modal === 'open-business-expense-modal') {
        setActiveTab('expenses');
        setShowExpenseModal(true);
      } else if (modal === 'open-client-modal') {
        setActiveTab('clients');
        setShowClientModal(true);
      } else if (modal === 'open-installment-modal') {
        setActiveTab('installments');
        setShowInstallmentModal(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredLeads = leads.filter(l => activeBrand === 'All' || l.brand === activeBrand);
  const filteredClients = clients.filter(c => activeBrand === 'All' || c.brand === activeBrand);
  const filteredPayments = businessPayments.filter(p => activeBrand === 'All' || p.brand === activeBrand).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredExpenses = businessExpenses.filter(e => activeBrand === 'All' || e.brand === activeBrand).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredInstallments = installments.filter(i => activeBrand === 'All' || clients.find(c => c.id === i.clientId)?.brand === activeBrand);

  React.useEffect(() => {
    const onLead = () => { setActiveTab('pipeline'); setShowLeadModal(true); };
    const onPayment = () => { setActiveTab('payments'); setShowPaymentModal(true); };
    const onExpense = () => { setActiveTab('expenses'); setShowExpenseModal(true); };
    const onClient = () => { setActiveTab('clients'); setShowClientModal(true); };
    window.addEventListener('open-lead-modal', onLead);
    window.addEventListener('open-payment-modal', onPayment);
    window.addEventListener('open-business-expense-modal', onExpense);
    window.addEventListener('open-client-modal', onClient);
    return () => {
      window.removeEventListener('open-lead-modal', onLead);
      window.removeEventListener('open-payment-modal', onPayment);
      window.removeEventListener('open-business-expense-modal', onExpense);
      window.removeEventListener('open-client-modal', onClient);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Business Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leads, clients, and agency revenue.</p>
        </div>
        <div className="flex w-full md:w-auto">
          {activeTab === 'pipeline' && <Button className="w-full md:w-auto" onClick={() => setShowLeadModal(true)}>+ Add Lead</Button>}
          {activeTab === 'clients' && <Button className="w-full md:w-auto" onClick={() => setShowClientModal(true)}>+ Add Client</Button>}
          {activeTab === 'payments' && <Button className="w-full md:w-auto" onClick={() => setShowPaymentModal(true)}>+ Log Payment</Button>}
          {activeTab === 'expenses' && <Button className="w-full md:w-auto" onClick={() => setShowExpenseModal(true)}>+ Add Expense</Button>}
          {activeTab === 'installments' && <Button className="w-full md:w-auto" onClick={() => setShowInstallmentModal(true)}>+ Create Installment</Button>}
        </div>
      </div>

      {/* Mobile: dropdown tab selector */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={e => setActiveTab(e.target.value as any)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
        >
          {(['pipeline', 'clients', 'payments', 'expenses', 'installments'] as const).map(tab => (
            <option key={tab} value={tab}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</option>
          ))}
        </select>
      </div>
      {/* Desktop: pill tabs */}
      <div className="hidden md:flex bg-white rounded-full p-1 shadow-sm border border-gray-100 flex-wrap mb-2 shrink-0">
          {(['pipeline', 'clients', 'payments', 'expenses', 'installments'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#18181b] text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
      </div>

      <div>
        {activeTab === 'pipeline' && <PipelineView leads={filteredLeads} updateLead={updateLead} deleteLead={deleteLead} onEdit={(lead) => { setEditingLead(lead); setShowLeadModal(true); }} />}
        {activeTab === 'clients' && <ClientsView clients={filteredClients} projects={projects} onEdit={(c) => { setEditingClient(c); setShowClientModal(true); }} />}
        {activeTab === 'payments' && <PaymentsView payments={filteredPayments} clients={clients} projects={projects} deletePayment={deleteBusinessPayment} onEdit={(p) => { setEditingPayment(p); setShowPaymentModal(true); }} />}
        {activeTab === 'expenses' && <ExpensesView expenses={filteredExpenses} deleteExpense={deleteBusinessExpense} onEdit={(e) => { setEditingExpense(e); setShowExpenseModal(true); }} />}
        {activeTab === 'installments' && <InstallmentsView installments={filteredInstallments} clients={clients} projects={projects} onMarkPaid={(inst) => { setShowPaidInstallmentModal(inst); setPaidAmount(inst.amount.toString()); setPaidDate(new Date()); setPaidInvoiceRef(''); }} onDelete={deleteInstallment} />}
      </div>

      <LeadModal isOpen={showLeadModal} onClose={() => { setShowLeadModal(false); setEditingLead(null); }} onSave={addLead} onUpdate={updateLead} editItem={editingLead} />
      <PaymentModal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }} onSaveIncoming={addBusinessPayment} onUpdateIncoming={updateBusinessPayment} onSaveOutgoing={addBusinessExpense} onUpdateOutgoing={updateBusinessExpense} clients={filteredClients} payments={businessPayments} projects={projects} editItem={editingPayment} onSaveInstallment={addInstallment} />
      <AddExpenseModal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }} onSaveBusiness={addBusinessExpense} onUpdateBusiness={updateBusinessExpense} editBusiness={editingExpense} initialType="business" />
      <ClientModal isOpen={showClientModal} onClose={() => { setShowClientModal(false); setEditingClient(null); }} onSave={addClient} onUpdate={updateClient} editItem={editingClient} />

      {/* Create Installment Modal */}
      <Modal isOpen={showInstallmentModal} onClose={() => setShowInstallmentModal(false)} title="Create Installment">
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const f = new FormData(form);
          const cId = f.get('cli') as string;
          const pId = f.get('proj') as string;
          const sName = f.get('svc') as string;
          const amt = parseFloat(f.get('amt') as string);
          const dDate = f.get('due') as string;
          if (!cId || !pId || !sName || !amt || !dDate) return;
          addInstallment({
            clientId: cId, projectId: pId, serviceName: sName, amount: amt,
            dueDate: dDate, status: 'pending', note: (f.get('note') as string) || undefined,
          });
          setShowInstallmentModal(false);
        }} className="space-y-4">
          <div><Label>Client</Label><select name="cli" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">{[...new Set(clients.map(c => c.id))].map(id => { const c = clients.find(x => x.id === id); return <option key={id} value={id}>{c?.name}</option>; })}</select></div>
          <div><Label>Project</Label><select name="proj" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          <div><Label>Service</Label><select name="svc" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">{(projects[0]?.servicePricing || []).map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
          <div><Label>Amount (₹)</Label><Input name="amt" type="number" step="0.01" required /></div>
          <div><Label>Due Date</Label><Input name="due" type="date" required /></div>
          <div><Label>Note (optional)</Label><Input name="note" /></div>
          <Button type="submit" className="w-full">Create Installment</Button>
        </form>
      </Modal>

      {/* Mark Installment as Paid Modal */}
      <Modal isOpen={!!showPaidInstallmentModal} onClose={() => setShowPaidInstallmentModal(null)} title="Mark Installment as Paid">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!showPaidInstallmentModal) return;
          const amt = parseFloat(paidAmount);
          if (!amt) return;
          addBusinessPayment({
            clientId: showPaidInstallmentModal.clientId,
            projectId: showPaidInstallmentModal.projectId,
            serviceName: showPaidInstallmentModal.serviceName,
            amount: amt,
            date: format(paidDate, 'yyyy-MM-dd'),
            invoiceReference: paidInvoiceRef || `INST-${showPaidInstallmentModal.id.slice(0, 6)}`,
            brand: clients.find(c => c.id === showPaidInstallmentModal.clientId)?.brand || 'Infinity Innovations',
          });
          updateInstallment(showPaidInstallmentModal.id, {
            status: 'paid',
            paidDate: format(paidDate, 'yyyy-MM-dd'),
            invoiceReference: paidInvoiceRef || undefined,
          });
          setShowPaidInstallmentModal(null);
        }} className="space-y-4">
          <div><Label>Amount (₹)</Label><Input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} required /></div>
          <div><Label>Payment Date</Label><DatePicker value={paidDate} onChange={setPaidDate} /></div>
          <div><Label>Invoice Reference</Label><Input value={paidInvoiceRef} onChange={e => setPaidInvoiceRef(e.target.value)} /></div>
          <Button type="submit" className="w-full">Save Payment</Button>
        </form>
      </Modal>
    </div>
  );
}

interface PipelineViewProps {
  leads: Lead[];
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  onEdit: (lead: Lead) => void;
}

function PipelineView({ leads, updateLead, deleteLead, onEdit }: PipelineViewProps) {
  const stages = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  const [stageFilter, setStageFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredLeads = stageFilter === 'All' ? leads : leads.filter(l => l.stage === stageFilter);

  // Desktop: Kanban columns, no horizontal scroll
  const renderKanban = () => (
    <div className="hidden lg:flex space-x-3 min-h-[400px]">
      {stages.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        return (
          <div key={stage} className="flex-1 bg-white border border-gray-200 flex flex-col rounded-xl min-w-0">
            <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-900 truncate">{stage}</span>
              <span className="text-[10px] tabular bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 shrink-0 ml-1">{stageLeads.length}</span>
            </div>
            <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto no-scrollbar">
              {stageLeads.length === 0 ? (
                <div className="text-[10px] text-gray-400 text-center italic py-4">No leads</div>
              ) : stageLeads.map(l => (
                <div key={l.id} className="bg-white border border-gray-200 p-2 shadow-sm hover:border-orange-500 rounded-lg transition-colors group cursor-pointer" onClick={() => onEdit(l)}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-xs text-gray-900 truncate">{l.name}</div>
                    <Badge className="shrink-0 ml-1 !text-[9px] !px-1.5">{l.brand}</Badge>
                  </div>
                  <div className="text-sm font-light tabular mb-1">{formatCurrency(l.estimatedValue)}</div>
                  {l.nextAction && (
                    <div className="text-[9px] text-gray-500 truncate mb-1">Next: {l.nextAction}</div>
                  )}
                  <div className="flex items-center space-x-1 pt-1.5 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                          className="text-[9px] bg-gray-100 border-none text-gray-900 py-0.5 px-1 rounded cursor-pointer"
                          value={l.stage}
                          onChange={(e) => updateLead(l.id, { stage: e.target.value })}
                        >
                          {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => { setDeleteTarget({ id: l.id, name: l.name }) }} className="text-red-500 text-[9px] hover:underline cursor-pointer ml-auto">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Mobile/Tablet: filtered list
  const renderList = () => (
    <div className="lg:hidden space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">Stage:</span>
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
        >
          <option value="All">All Stages</option>
          {stages.map(s => (
            <option key={s} value={s}>{s} ({leads.filter(l => l.stage === s).length})</option>
          ))}
        </select>
      </div>
      {filteredLeads.length === 0 ? (
        <div className="text-gray-900 text-sm italic">No leads in this stage.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredLeads.map(l => (
            <div key={l.id} className="bg-white border border-gray-200 p-3 shadow-sm hover:border-orange-500 rounded-xl transition-colors cursor-pointer" onClick={() => onEdit(l)}>
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm text-gray-900">{l.name}</div>
                <Badge>{l.brand}</Badge>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={l.stage === 'Won' ? 'success' : l.stage === 'Lost' ? 'danger' : 'warning'}>{l.stage}</Badge>
              </div>
              <div className="text-lg font-light tabular mb-1">{formatCurrency(l.estimatedValue)}</div>
              {l.nextAction && (
                <div className="text-[10px] text-gray-500 mb-2">Next: {l.nextAction} ({format(new Date(l.nextActionDate), 'MMM d')})</div>
              )}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <select
                    className="text-[10px] bg-gray-100 border-none text-gray-900 py-1 px-2 rounded cursor-pointer"
                    value={l.stage}
                    onChange={(e) => updateLead(l.id, { stage: e.target.value })}
                  >
                    {stages.map(s => <option key={s} value={s}>Move to {s}</option>)}
                  </select>
                  <button onClick={() => { setDeleteTarget({ id: l.id, name: l.name }) }} className="text-red-500 text-[10px] hover:underline cursor-pointer ml-auto">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderKanban()}
      {renderList()}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Lead"
        message={`Are you sure you want to delete the lead "${deleteTarget?.name}"?`}
        onConfirm={() => { if (deleteTarget) deleteLead(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  onEdit: (client: Client) => void;
}

function ClientsView({ clients, projects, onEdit }: ClientsViewProps) {
  if (clients.length === 0) return <div className="text-gray-900 italic">No clients yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Client Name</th>
            <th className="pb-2 p-4 md:p-6 font-semibold hidden md:table-cell">Projects</th>
            <th className="pb-2 p-4 md:p-6 font-semibold hidden md:table-cell">Contact</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c: any) => {
            const clientProjects = projects.filter((p: any) => p.clientId === c.id);
            return (
              <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(c)}>
                <td className="p-4 md:p-6 font-medium">
                  <div>{c.name}</div>
                  <div className="md:hidden text-[10px] text-gray-500 mt-0.5">{c.contact}</div>
                  {c.businessName && <div className="text-[10px] text-gray-900 mt-1">{c.businessName}</div>}
                </td>
                <td className="p-4 md:p-6 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {clientProjects.length === 0 ? (
                      <span className="text-[10px] text-gray-400 italic">No projects</span>
                    ) : (
                      clientProjects.map((p: any) => (
                        <Badge key={p.id} variant="default">{p.title}</Badge>
                      ))
                    )}
                  </div>
                </td>
                <td className="p-4 md:p-6 hidden md:table-cell text-gray-900">{c.contact}</td>
                <td className="p-4 md:p-6">
                  <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Paused' ? 'warning' : 'danger'}>{c.status}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

interface PaymentsViewProps {
  payments: BusinessPayment[];
  clients: Client[];
  projects: Project[];
  deletePayment: (id: string) => void;
  onEdit: (payment: BusinessPayment) => void;
}

function PaymentsView({ payments, clients, projects, deletePayment, onEdit }: PaymentsViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  if (payments.length === 0) return <div className="text-gray-900 italic">No payments recorded yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Date</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Client, Project & Ref</th>
            <th className="pb-2 p-4 md:p-6 font-semibold text-right">Amount</th>
            <th className="pb-2 p-4 md:p-6"></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.clientId);
            const proj = projects.find((pr: any) => pr.id === p.projectId);
            return (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(p)}>
                <td className="p-4 md:p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                <td className="p-4 md:p-6">
                  <div className="font-medium">{client?.name || 'Unknown'} <Badge className="ml-2">{p.brand}</Badge></div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{proj?.title || p.projectId} — {p.serviceName}</div>
                  <div className="text-[10px] text-gray-900 mt-0.5">Ref: {p.invoiceReference}</div>
                </td>
                <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                <td className="p-4 md:p-6 text-right">
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: `${formatCurrency(p.amount)} payment` }); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Payment"
        message={`Are you sure you want to delete the ${deleteTarget?.name}?`}
        onConfirm={() => { if (deleteTarget) deletePayment(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

interface ExpensesViewProps {
  expenses: BusinessExpense[];
  deleteExpense: (id: string) => void;
  onEdit: (expense: BusinessExpense) => void;
}

function ExpensesView({ expenses, deleteExpense, onEdit }: ExpensesViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  if (expenses.length === 0) return <div className="text-gray-900 italic">No business expenses recorded yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Date</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Brand & Category</th>
            <th className="pb-2 p-4 md:p-6 font-semibold text-right">Amount</th>
            <th className="pb-2 p-4 md:p-6"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e: any) => (
            <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(e)}>
              <td className="p-4 md:p-6 text-gray-900">{format(new Date(e.date), 'MMM d, yyyy')}</td>
              <td className="p-4 md:p-6">
                <Badge>{e.brand}</Badge>
                <span className="ml-2 text-gray-800">{e.category}</span>
              </td>
              <td className="p-4 md:p-6 text-right tabular text-red-500 font-semibold">-{formatCurrency(e.amount)}</td>
              <td className="p-4 md:p-6 text-right">
                <button onClick={(e2) => { e2.stopPropagation(); setDeleteTarget({ id: e.id, name: `${e.category} expense` }); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message={`Are you sure you want to delete the ${deleteTarget?.name}?`}
        onConfirm={() => { if (deleteTarget) deleteExpense(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

interface InstallmentsViewProps {
  installments: Installment[];
  clients: Client[];
  projects: Project[];
  onMarkPaid: (inst: Installment) => void;
  onDelete: (id: string) => void;
}

function InstallmentsView({ installments, clients, projects, onMarkPaid, onDelete }: InstallmentsViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const sorted = [...installments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  if (sorted.length === 0) return <div className="text-gray-900 italic">No installments created yet. Use "Mark as Installment" when logging a payment or create one directly.</div>;
  return (
    <Card className="p-0 bg-white overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="p-4 md:p-6 font-semibold">Due Date</th>
            <th className="p-4 md:p-6 font-semibold">Client</th>
            <th className="p-4 md:p-6 font-semibold">Project</th>
            <th className="p-4 md:p-6 font-semibold">Service</th>
            <th className="p-4 md:p-6 font-semibold text-right">Amount</th>
            <th className="p-4 md:p-6 font-semibold">Status</th>
            <th className="p-4 md:p-6 font-semibold">Paid Date</th>
            <th className="p-4 md:p-6"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(inst => {
            const client = clients.find(c => c.id === inst.clientId);
            const project = projects.find(p => p.id === inst.projectId);
            const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date();
            const status = isOverdue ? 'overdue' : inst.status;
            return (
              <tr key={inst.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-4 md:p-6 text-gray-900 whitespace-nowrap">{format(new Date(inst.dueDate), 'MMM d, yyyy')}</td>
                <td className="p-4 md:p-6 text-gray-800">{client?.name || inst.clientId.slice(0, 8)}</td>
                <td className="p-4 md:p-6 text-gray-500">{project?.title || '—'}</td>
                <td className="p-4 md:p-6 text-gray-500">{inst.serviceName}</td>
                <td className="p-4 md:p-6 text-right tabular font-semibold text-gray-900">{formatCurrency(inst.amount)}</td>
                <td className="p-4 md:p-6">
                  <Badge variant={status === 'paid' ? 'success' : status === 'overdue' ? 'error' : 'secondary'} className="capitalize">{status}</Badge>
                </td>
                <td className="p-4 md:p-6 text-gray-500 whitespace-nowrap">{inst.paidDate ? format(new Date(inst.paidDate), 'MMM d, yyyy') : '—'}</td>
                <td className="p-4 md:p-6">
                  {status === 'pending' && (
                    <button onClick={() => onMarkPaid(inst)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">Mark Paid</button>
                  )}
                  {status === 'overdue' && (
                    <button onClick={() => onMarkPaid(inst)} className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer">Mark Paid</button>
                  )}
                  {status === 'paid' && (
                    <button onClick={() => { setDeleteTarget({ id: inst.id, name: `${inst.serviceName} installment` }); }} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Installment"
        message={`Delete ${deleteTarget?.name}?`}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}

// Modals

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Lead, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Lead>) => void;
  editItem?: Lead | null;
}

function LeadModal({ isOpen, onClose, onSave, onUpdate, editItem }: LeadModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [source, setSource] = useState('');
  const [stage, setStage] = useState('Lead');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState(new Date());

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setBrand(editItem.brand);
      setSource(editItem.source);
      setStage(editItem.stage);
      setEstimatedValue(editItem.estimatedValue.toString());
      setNextAction(editItem.nextAction);
      setNextActionDate(new Date(editItem.nextActionDate));
    } else {
      setName(''); setBrand('Infinity Innovations'); setSource(''); setStage('Lead'); setEstimatedValue(''); setNextAction(''); setNextActionDate(new Date());
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !estimatedValue) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { name, brand, source, stage, estimatedValue: parseFloat(estimatedValue), nextAction, nextActionDate: format(nextActionDate, 'yyyy-MM-dd') });
    } else {
      onSave({ name, brand, source, stage, estimatedValue: parseFloat(estimatedValue), nextAction, nextActionDate: format(nextActionDate, 'yyyy-MM-dd') });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Lead' : 'Add Lead'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
        <div>
          <Label>Brand</Label>
          <Select value={brand} onChange={e => setBrand(e.target.value as Brand)}>
            {BRANDS.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
        <div><Label>Source / Contact</Label><Input value={source} onChange={e => setSource(e.target.value)} /></div>
        <div><Label>Estimated Value</Label><Input type="number" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} required /></div>
        <div><Label>Next Action</Label><Input value={nextAction} onChange={e => setNextAction(e.target.value)} /></div>
        <div><Label>Next Action Date</Label><DatePicker value={nextActionDate} onChange={setNextActionDate} /></div>
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Lead' : 'Save Lead'}</Button>
      </form>
    </Modal>
  );
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Client, 'id' | 'createdAt'>) => Promise<string | null>;
  onUpdate?: (id: string, updates: Partial<Client>) => void;
  editItem?: Client | null;
}

function ClientModal({ isOpen, onClose, onSave, onUpdate, editItem }: ClientModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [contact, setContact] = useState('');
  const [mail, setMail] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Paused' | 'Churned'>('Active');
  const [createLogin, setCreateLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginConfirm, setLoginConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [hasLogin, setHasLogin] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name); setBrand(editItem.brand); setContact(editItem.contact); setMail(editItem.mail); setAddress(editItem.address); setBusinessName(editItem.businessName); setStatus(editItem.status);
      setAvatarPreview(editItem.avatarUrl || null);
      supabase.from('client_users').select('id').eq('client_id', editItem.id).maybeSingle().then(({ data }) => setHasLogin(!!data));
    } else {
      setName(''); setBrand('Infinity Innovations'); setContact(''); setMail(''); setAddress(''); setBusinessName(''); setStatus('Active');
      setHasLogin(false); setAvatarPreview(null);
    }
    setCreateLogin(false); setLoginPassword(''); setLoginConfirm(''); setSaving(false); setLoginError(''); setAvatarFile(null);
  }, [editItem, isOpen]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (clientId: string) => {
    if (!avatarFile) return;
    const path = `avatars/${clientId}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
    if (uploadErr) {
      console.error('Avatar upload failed:', uploadErr);
      return;
    }
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 31536000);
    if (signed?.signedUrl) {
      return signed.signedUrl;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editItem && onUpdate) {
      onUpdate(editItem.id, { name, brand, contact, mail, address, businessName, status });
      if (createLogin && mail && loginPassword) {
        setSaving(true);
        setLoginError('');
        if (loginPassword.length < 6) { setLoginError('Password must be at least 6 characters'); setSaving(false); return; }
        if (loginPassword !== loginConfirm) { setLoginError('Passwords do not match'); setSaving(false); return; }
        const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
          body: JSON.stringify({ email: mail, password: loginPassword, data: { role: 'client', client_id: editItem.id } }),
        });
        const signUpData = await res.json();
        let userId = signUpData.user?.id || signUpData.id;
        if (!userId) {
          if (signUpData.code == 422 || signUpData.code == '23505') {
            const { data: existingId } = await supabase.rpc('get_auth_user_id', { email: mail });
            if (!existingId) {
              setLoginError(`"${mail}" already registered but couldn't resolve user.`);
              setSaving(false); return;
            }
            userId = existingId;
          } else {
            setLoginError(`Login failed: ${signUpData.msg || signUpData.message || JSON.stringify(signUpData)}`);
            setSaving(false); return;
          }
        }
        const { error: linkErr } = await supabase.rpc('link_client_user', {
          user_id: userId, client_id: editItem.id, user_name: name, email: mail,
        });
        if (linkErr) { setLoginError(`Link failed: ${linkErr.message}`); setSaving(false); return; }
      }
      if (avatarFile) {
        const signedUrl = await uploadAvatar(editItem.id);
        if (signedUrl) onUpdate(editItem.id, { avatarUrl: signedUrl });
      }
      onClose();
      return;
    }

    setSaving(true);
    setLoginError('');

    const clientId = await onSave({ name, brand, contact, mail, address, businessName, status, services: [] });

    if (avatarFile && clientId) {
      const signedUrl = await uploadAvatar(clientId);
      if (signedUrl) onUpdate(clientId, { avatarUrl: signedUrl });
    }

    if (createLogin && clientId && mail && loginPassword) {
      if (loginPassword.length < 6) {
        setLoginError('Password must be at least 6 characters');
        setSaving(false);
        return;
      }
      if (loginPassword !== loginConfirm) {
        setLoginError('Passwords do not match');
        setSaving(false);
        return;
      }
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ email: mail, password: loginPassword, data: { role: 'client', client_id: clientId } }),
      });
      const signUpData = await res.json();
      let userId = signUpData.user?.id || signUpData.id;
      if (!userId) {
        if (signUpData.code == 422 || signUpData.code == '23505') {
          const { data: existingId } = await supabase.rpc('get_auth_user_id', { email: mail });
          if (!existingId) {
            setLoginError(`"${mail}" already registered but couldn't resolve user.`);
            setSaving(false); return;
          }
          userId = existingId;
        } else {
          setLoginError(`Client saved but login failed: ${signUpData.msg || signUpData.message || JSON.stringify(signUpData)}`);
          setSaving(false); return;
        }
      }
      const { error: linkErr } = await supabase.rpc('link_client_user', {
        user_id: userId, client_id: clientId, user_name: name, email: mail,
      });
      if (linkErr) {
        setLoginError(`Client saved but link failed: ${linkErr.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Client' : 'Add Client'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <div
            className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-500 overflow-hidden group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={32} className="text-gray-400" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        </div>
        <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Brand</Label>
            <Select value={brand} onChange={e => setBrand(e.target.value as Brand)}>
              {BRANDS.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Churned">Churned</option>
            </Select>
          </div>
        </div>
        <div><Label>Email</Label><Input type="email" value={mail} onChange={e => setMail(e.target.value)} /></div>
        <div><Label>Contact Number</Label><Input value={contact} onChange={e => setContact(e.target.value)} /></div>
        <div><Label>Business Name</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
        <div><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {editItem && hasLogin ? (
            <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl font-medium">
              Login credentials already created
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLogin}
                  onChange={e => setCreateLogin(e.target.checked)}
                  className="rounded border-gray-200 bg-white text-orange-500 focus:ring-orange-400"
                />
                <span className="text-xs font-medium text-gray-700">Create client login</span>
              </label>
              {createLogin && (
                <>
                  <div><Label>Password</Label><Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="Min 6 characters" /></div>
                  <div><Label>Confirm Password</Label><Input type="password" value={loginConfirm} onChange={e => setLoginConfirm(e.target.value)} required placeholder="Re-enter password" /></div>
                </>
              )}
            </>
          )}
          </div>
        {loginError && <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl font-medium">{loginError}</div>}
        <Button type="submit" className="w-full mt-4" disabled={saving}>
          {saving ? 'Saving...' : editItem ? 'Update Client' : 'Save Client'}
        </Button>
      </form>
    </Modal>
  );
}


