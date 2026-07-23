import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Select, Label, Modal, Badge, DatePicker } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { Brand, Lead, Client, Engagement, BusinessPayment, BusinessExpense } from '../types';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

const BRANDS: (Brand | 'All')[] = ['All', 'Infinity Innovations'];

const SERVICES_OFFERED = [
  'Website Development',
  'Web App Development',
  'App Development',
  'Digital Marketing',
  'Social Media Marketing',
  'Content Creation',
  'AI Agent Automation',
  'WhatsApp AI Agent',
  'Custom AI App'
];

export default function Business() {
  const [activeBrand, setActiveBrand] = useState<Brand | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'clients' | 'engagements' | 'payments' | 'expenses'>('pipeline');
  const { 
    leads, addLead, updateLead, deleteLead,
    clients, addClient, updateClient, deleteClient,
    engagements, addEngagement, updateEngagement, deleteEngagement,
    businessPayments, addBusinessPayment, updateBusinessPayment, deleteBusinessPayment,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense
  } = useData();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingPayment, setEditingPayment] = useState<BusinessPayment | null>(null);
  const [editingExpense, setEditingExpense] = useState<BusinessExpense | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);

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
      } else if (modal === 'open-engagement-modal') {
        setActiveTab('engagements');
        setShowEngagementModal(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredLeads = leads.filter(l => activeBrand === 'All' || l.brand === activeBrand);
  const filteredClients = clients.filter(c => activeBrand === 'All' || c.brand === activeBrand);
  const filteredEngagements = engagements.filter(e => activeBrand === 'All' || e.brand === activeBrand);
  const filteredPayments = businessPayments.filter(p => activeBrand === 'All' || p.brand === activeBrand).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredExpenses = businessExpenses.filter(e => activeBrand === 'All' || e.brand === activeBrand).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  React.useEffect(() => {
    const onLead = () => { setActiveTab('pipeline'); setShowLeadModal(true); };
    const onPayment = () => { setActiveTab('payments'); setShowPaymentModal(true); };
    const onExpense = () => { setActiveTab('expenses'); setShowExpenseModal(true); };
    const onClient = () => { setActiveTab('clients'); setShowClientModal(true); };
    const onEngagement = () => { setActiveTab('engagements'); setShowEngagementModal(true); };
    window.addEventListener('open-lead-modal', onLead);
    window.addEventListener('open-payment-modal', onPayment);
    window.addEventListener('open-business-expense-modal', onExpense);
    window.addEventListener('open-client-modal', onClient);
    window.addEventListener('open-engagement-modal', onEngagement);
    return () => {
      window.removeEventListener('open-lead-modal', onLead);
      window.removeEventListener('open-payment-modal', onPayment);
      window.removeEventListener('open-business-expense-modal', onExpense);
      window.removeEventListener('open-client-modal', onClient);
      window.removeEventListener('open-engagement-modal', onEngagement);
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
          {activeTab === 'engagements' && <Button className="w-full md:w-auto" onClick={() => setShowEngagementModal(true)}>+ Add Engagement</Button>}
          {activeTab === 'payments' && <Button className="w-full md:w-auto" onClick={() => setShowPaymentModal(true)}>+ Log Payment</Button>}
          {activeTab === 'expenses' && <Button className="w-full md:w-auto" onClick={() => setShowExpenseModal(true)}>+ Add Expense</Button>}
        </div>
      </div>

      {/* Mobile: dropdown tab selector */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={e => setActiveTab(e.target.value as any)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
        >
          {(['pipeline', 'clients', 'engagements', 'payments', 'expenses'] as const).map(tab => (
            <option key={tab} value={tab}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</option>
          ))}
        </select>
      </div>
      {/* Desktop: pill tabs */}
      <div className="hidden md:flex bg-white rounded-full p-1 shadow-sm border border-gray-100 flex-wrap mb-2 shrink-0">
        {(['pipeline', 'clients', 'engagements', 'payments', 'expenses'] as const).map(tab => (
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
        {activeTab === 'clients' && <ClientsView clients={filteredClients} onEdit={(c) => { setEditingClient(c); setShowClientModal(true); }} />}
        {activeTab === 'engagements' && <EngagementsView engagements={filteredEngagements} clients={clients} onEdit={(e) => { setEditingEngagement(e); setShowEngagementModal(true); }} />}
        {activeTab === 'payments' && <PaymentsView payments={filteredPayments} clients={clients} engagements={engagements} deletePayment={deleteBusinessPayment} onEdit={(p) => { setEditingPayment(p); setShowPaymentModal(true); }} />}
        {activeTab === 'expenses' && <ExpensesView expenses={filteredExpenses} deleteExpense={deleteBusinessExpense} onEdit={(e) => { setEditingExpense(e); setShowExpenseModal(true); }} />}
      </div>

      <LeadModal isOpen={showLeadModal} onClose={() => { setShowLeadModal(false); setEditingLead(null); }} onSave={addLead} onUpdate={updateLead} editItem={editingLead} />
      <PaymentModal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }} onSaveIncoming={addBusinessPayment} onUpdateIncoming={updateBusinessPayment} onSaveOutgoing={addBusinessExpense} onUpdateOutgoing={updateBusinessExpense} clients={filteredClients} engagements={filteredEngagements} payments={businessPayments} editItem={editingPayment} />
      <BusinessExpenseModal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }} onSave={addBusinessExpense} onUpdate={updateBusinessExpense} editItem={editingExpense} />
      <ClientModal isOpen={showClientModal} onClose={() => { setShowClientModal(false); setEditingClient(null); }} onSave={addClient} onUpdate={updateClient} editItem={editingClient} />
      <EngagementModal isOpen={showEngagementModal} onClose={() => { setShowEngagementModal(false); setEditingEngagement(null); }} onSave={addEngagement} onUpdate={updateEngagement} clients={clients} editItem={editingEngagement} />
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
                    <button onClick={() => { deleteLead(l.id) }} className="text-red-500 text-[9px] hover:underline cursor-pointer ml-auto">Delete</button>
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
                <button onClick={() => { deleteLead(l.id) }} className="text-red-500 text-[10px] hover:underline cursor-pointer ml-auto">Delete</button>
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
    </>
  );
}

interface ClientsViewProps {
  clients: Client[];
  onEdit: (client: Client) => void;
}

function ClientsView({ clients, onEdit }: ClientsViewProps) {
  if (clients.length === 0) return <div className="text-gray-900 italic">No clients yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Client Name</th>
            <th className="pb-2 p-4 md:p-6 font-semibold hidden md:table-cell">Services</th>
            <th className="pb-2 p-4 md:p-6 font-semibold hidden md:table-cell">Contact</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c: any) => (
            <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(c)}>
              <td className="p-4 md:p-6 font-medium">
                <div>{c.name}</div>
                <div className="md:hidden text-[10px] text-gray-500 mt-0.5">{c.contact}</div>
                {c.businessName && <div className="text-[10px] text-gray-900 mt-1">{c.businessName}</div>}
              </td>
              <td className="p-4 md:p-6 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {c.services?.map((s: string) => (
                    <Badge key={s} variant="default">{s}</Badge>
                  ))}
                </div>
              </td>
              <td className="p-4 md:p-6 hidden md:table-cell text-gray-900">{c.contact}</td>
              <td className="p-4 md:p-6">
                <Badge variant={c.status === 'Active' ? 'success' : c.status === 'Paused' ? 'warning' : 'danger'}>{c.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

interface EngagementsViewProps {
  engagements: Engagement[];
  clients: Client[];
  onEdit: (engagement: Engagement) => void;
}

function EngagementsView({ engagements, clients, onEdit }: EngagementsViewProps) {
  if (engagements.length === 0) return <div className="text-gray-900 italic">No engagements yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Client</th>
            <th className="pb-2 p-4 md:p-6 font-semibold hidden md:table-cell">Terms</th>
            <th className="pb-2 p-4 md:p-6 font-semibold text-right">Value</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {engagements.map((e: any) => {
            const client = clients.find((c: any) => c.id === e.clientId);
            return (
              <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(e)}>
                <td className="p-4 md:p-6 font-medium">{client?.name || 'Unknown'} <Badge className="ml-2">{e.brand}</Badge></td>
                <td className="p-4 md:p-6 text-gray-900 hidden md:table-cell">{e.paymentTerms} (Started {format(new Date(e.startDate), 'MMM yyyy')})</td>
                <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">{formatCurrency(e.value)}</td>
                <td className="p-4 md:p-6">
                  <Badge variant={e.status === 'Active' ? 'success' : 'default'}>{e.status}</Badge>
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
  engagements: Engagement[];
  deletePayment: (id: string) => void;
  onEdit: (payment: BusinessPayment) => void;
}

function PaymentsView({ payments, clients, engagements, deletePayment, onEdit }: PaymentsViewProps) {
  if (payments.length === 0) return <div className="text-gray-900 italic">No payments recorded yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-4 md:p-6 font-semibold">Date</th>
            <th className="pb-2 p-4 md:p-6 font-semibold">Client & Ref</th>
            <th className="pb-2 p-4 md:p-6 font-semibold text-right">Amount</th>
            <th className="pb-2 p-4 md:p-6"></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.clientId);
            return (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(p)}>
                <td className="p-4 md:p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                <td className="p-4 md:p-6">
                  <div className="font-medium">{client?.name || 'Unknown'} <Badge className="ml-2">{p.brand}</Badge></div>
                  <div className="text-[10px] text-gray-900 mt-1">Ref: {p.invoiceReference}</div>
                </td>
                <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                <td className="p-4 md:p-6 text-right">
                  <button onClick={(e) => { e.stopPropagation(); deletePayment(p.id); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

interface ExpensesViewProps {
  expenses: BusinessExpense[];
  deleteExpense: (id: string) => void;
  onEdit: (expense: BusinessExpense) => void;
}

function ExpensesView({ expenses, deleteExpense, onEdit }: ExpensesViewProps) {
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
                <button onClick={(e2) => { e2.stopPropagation(); deleteExpense(e.id); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIncoming: (item: Omit<BusinessPayment, 'id' | 'createdAt' | 'engagementId'>) => void;
  onUpdateIncoming?: (id: string, updates: Partial<BusinessPayment>) => void;
  onSaveOutgoing: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  onUpdateOutgoing?: (id: string, updates: Partial<BusinessExpense>) => void;
  clients: Client[];
  engagements: Engagement[];
  payments: BusinessPayment[];
  editItem?: BusinessPayment | null;
}

function PaymentModal({ isOpen, onClose, onSaveIncoming, onUpdateIncoming, onSaveOutgoing, onUpdateOutgoing, clients, engagements, payments, editItem }: PaymentModalProps) {
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
  
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [invoiceReference, setInvoiceReference] = useState('');

  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [category, setCategory] = useState<BusinessExpense['category']>('Tools');

  const activeEngagement = engagements.find((e: any) => e.clientId === clientId && e.status === 'Active');
  const collected = activeEngagement
    ? payments.filter((p: any) => p.engagementId === activeEngagement.id).reduce((s: number, p: any) => s + p.amount, 0)
    : 0;
  const progress = activeEngagement ? Math.min(collected / activeEngagement.value, 1) : 0;

  useEffect(() => {
    if (editItem) {
      setType('incoming');
      setClientId(editItem.clientId);
      setAmount(editItem.amount.toString());
      setDate(new Date(editItem.date));
      setInvoiceReference(editItem.invoiceReference);
    } else {
      setType('incoming');
      setClientId(''); setAmount(''); setDate(new Date()); setInvoiceReference(''); setBrand('Infinity Innovations'); setCategory('Tools');
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    if (type === 'incoming') {
      if (editItem && onUpdateIncoming) {
        onUpdateIncoming(editItem.id, { clientId, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), invoiceReference });
      } else {
        if (!clientId) return;
        const client = clients.find((c: any) => c.id === clientId);
        onSaveIncoming({ clientId, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), invoiceReference, brand: client?.brand || 'Infinity Innovations' });
      }
    } else {
      onSaveOutgoing({ brand, category, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd') });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Payment' : 'Log Transaction'}>
      {!editItem && (
        <div className="flex bg-gray-100 p-1 mb-4 rounded-xl">
          <button 
            type="button"
            className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${type === 'incoming' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setType('incoming')}
          >
            Incoming
          </button>
          <button 
            type="button"
            className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${type === 'outgoing' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setType('outgoing')}
          >
            Outgoing
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'incoming' ? (
          <>
            <div>
              <Label>Client</Label>
              <Select value={clientId} onChange={e => setClientId(e.target.value)} required>
                <option value="">Select a client...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
              </Select>
            </div>
            {clientId && activeEngagement ? (
              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{formatCurrency(collected)} collected of {formatCurrency(activeEngagement.value)}</span>
                  <span className="font-semibold text-gray-800">{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            ) : clientId ? (
              <div className="text-xs text-gray-400 italic">No active engagement — unlinked payment</div>
            ) : null}
            <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>Date</Label><DatePicker value={date} onChange={setDate} /></div>
            <div><Label>Invoice Reference</Label><Input value={invoiceReference} onChange={e => setInvoiceReference(e.target.value)} /></div>
          </>
        ) : (
          <>
            <div>
              <Label>Brand</Label>
              <Select value={brand} onChange={e => setBrand(e.target.value as Brand)}>
                {BRANDS.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={e => setCategory(e.target.value as any)}>
                <option value="Tools">Tools</option>
                <option value="Ads">Ads</option>
                <option value="Contractor">Contractor</option>
                <option value="Subscription">Subscription</option>
                <option value="Domain Purchase">Domain Purchase</option>
                <option value="SSL Certificate">SSL Certificate</option>
                <option value="Posting Subscription">Posting Subscription</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>Date</Label><DatePicker value={date} onChange={setDate} /></div>
          </>
        )}
        <Button type="submit" className="w-full mt-4" disabled={type === 'incoming' && clients.length === 0 && !editItem}>{editItem ? 'Update Payment' : `Save ${type === 'incoming' ? 'Payment' : 'Expense'}`}</Button>
      </form>
    </Modal>
  );
}

interface BusinessExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<BusinessExpense>) => void;
  editItem?: BusinessExpense | null;
}

function BusinessExpenseModal({ isOpen, onClose, onSave, onUpdate, editItem }: BusinessExpenseModalProps) {
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [category, setCategory] = useState<BusinessExpense['category']>('Tools');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (editItem) {
      setBrand(editItem.brand);
      setCategory(editItem.category as BusinessExpense['category']);
      setAmount(editItem.amount.toString());
      setDate(new Date(editItem.date));
    } else {
      setBrand('Infinity Innovations'); setCategory('Tools'); setAmount(''); setDate(new Date());
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { brand, category, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd') });
    } else {
      onSave({ brand, category, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd') });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Business Expense' : 'Add Business Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Brand</Label>
          <Select value={brand} onChange={e => setBrand(e.target.value as Brand)}>
            {BRANDS.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onChange={e => setCategory(e.target.value as any)}>
            <option value="Tools">Tools</option>
            <option value="Ads">Ads</option>
            <option value="Contractor">Contractor</option>
            <option value="Subscription">Subscription</option>
            <option value="Domain Purchase">Domain Purchase</option>
            <option value="SSL Certificate">SSL Certificate</option>
            <option value="Posting Subscription">Posting Subscription</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <div><Label>Date</Label><DatePicker value={date} onChange={setDate} /></div>
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Expense' : 'Save Expense'}</Button>
      </form>
    </Modal>
  );
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Client, 'id' | 'createdAt'>) => void;
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
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<'Active' | 'Paused' | 'Churned'>('Active');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name); setBrand(editItem.brand); setContact(editItem.contact); setMail(editItem.mail); setAddress(editItem.address); setBusinessName(editItem.businessName); setServices(editItem.services); setStatus(editItem.status);
    } else {
      setName(''); setBrand('Infinity Innovations'); setContact(''); setMail(''); setAddress(''); setBusinessName(''); setServices([]); setStatus('Active');
    }
  }, [editItem, isOpen]);

  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { name, brand, contact, mail, address, businessName, services, status });
    } else {
      onSave({ name, brand, contact, mail, address, businessName, services, status });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Client' : 'Add Client'}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <Label>Services Interested In</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar p-2 border border-gray-200 bg-white rounded-md">
            {SERVICES_OFFERED.map(s => (
              <label key={s} className="flex items-center space-x-2 text-xs text-gray-800">
                <input 
                  type="checkbox" 
                  checked={services.includes(s)}
                  onChange={() => toggleService(s)}
                  className="rounded border-gray-200 bg-white text-green-500 focus:ring-green-400"
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Client' : 'Save Client'}</Button>
      </form>
    </Modal>
  );
}

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Engagement, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Engagement>) => void;
  clients: Client[];
  editItem?: Engagement | null;
}

function EngagementModal({ isOpen, onClose, onSave, onUpdate, clients, editItem }: EngagementModalProps) {
  const [clientId, setClientId] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [type, setType] = useState<'Project' | 'Retainer'>('Project');
  const [paymentTerms, setPaymentTerms] = useState<'Milestones' | 'Monthly' | 'Upfront'>('Milestones');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'On Hold'>('Active');
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    if (editItem) {
      setClientId(editItem.clientId); setBrand(editItem.brand); setType(editItem.type); setPaymentTerms(editItem.paymentTerms); setValue(editItem.value.toString()); setStatus(editItem.status); setStartDate(new Date(editItem.startDate));
    } else {
      setClientId(''); setBrand('Infinity Innovations'); setType('Project'); setPaymentTerms('Milestones'); setValue(''); setStatus('Active'); setStartDate(new Date());
    }
  }, [editItem, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { brand, type, paymentTerms, value: parseFloat(value), status, startDate: format(startDate, 'yyyy-MM-dd') });
    } else {
      if (!clientId) return;
      onSave({ clientId, brand, type, paymentTerms, value: parseFloat(value), status, startDate: format(startDate, 'yyyy-MM-dd') });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Engagement' : 'Add Engagement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Client</Label>
          <Select value={clientId} onChange={e => setClientId(e.target.value)} required>
            <option value="">Select Client...</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
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
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onChange={e => setType(e.target.value as any)}>
              <option value="Project">Project</option>
              <option value="Retainer">Retainer</option>
            </Select>
          </div>
          <div>
            <Label>Payment Terms</Label>
            <Select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value as any)}>
              <option value="Milestones">Milestones</option>
              <option value="Monthly">Monthly</option>
              <option value="Upfront">Upfront</option>
            </Select>
          </div>
        </div>
        <div><Label>Value</Label><Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required /></div>
        <div><Label>Start Date</Label><DatePicker value={startDate} onChange={setStartDate} /></div>
        
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Engagement' : 'Save Engagement'}</Button>
      </form>
    </Modal>
  );
}
