import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Select, Label, Modal, Badge } from '../components/ui';
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
    businessPayments, addBusinessPayment, deleteBusinessPayment,
    businessExpenses, addBusinessExpense, deleteBusinessExpense
  } = useData();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);

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

      <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 max-w-full md:max-w-fit mb-2 overflow-x-auto no-scrollbar shrink-0">
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
        {activeTab === 'pipeline' && <PipelineView leads={filteredLeads} updateLead={updateLead} deleteLead={deleteLead} />}
        {activeTab === 'clients' && <ClientsView clients={filteredClients} />}
        {activeTab === 'engagements' && <EngagementsView engagements={filteredEngagements} clients={clients} />}
        {activeTab === 'payments' && <PaymentsView payments={filteredPayments} clients={clients} engagements={engagements} deletePayment={deleteBusinessPayment} />}
        {activeTab === 'expenses' && <ExpensesView expenses={filteredExpenses} deleteExpense={deleteBusinessExpense} />}
      </div>

      <LeadModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} onSave={addLead} />
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSaveIncoming={addBusinessPayment} onSaveOutgoing={addBusinessExpense} clients={filteredClients} engagements={filteredEngagements} />
      <BusinessExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSave={addBusinessExpense} />
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} onSave={addClient} />
      <EngagementModal isOpen={showEngagementModal} onClose={() => setShowEngagementModal(false)} onSave={addEngagement} clients={clients} />
    </div>
  );
}

interface PipelineViewProps {
  leads: Lead[];
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
}

function PipelineView({ leads, updateLead, deleteLead }: PipelineViewProps) {
  const stages = ['Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
      {stages.map(stage => {
        const stageLeads = leads.filter((l: any) => l.stage === stage);
        return (
          <div key={stage} className="min-w-[280px] flex-1 bg-white border border-gray-200 flex flex-col h-full rounded-sm">
            <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-sm flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-900">{stage}</span>
              <span className="text-[10px] tabular bg-gray-100 px-2 py-0.5 rounded text-gray-500">{stageLeads.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto no-scrollbar">
              {stageLeads.map((l: any) => (
                <div key={l.id} className="bg-white border border-gray-200 p-3 shadow-sm hover:border-orange-500 rounded-xl transition-colors relative group">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">{l.name}</div>
                    <Badge>{l.brand}</Badge>
                  </div>
                  <div className="text-xl font-light tabular my-2">{formatCurrency(l.estimatedValue)}</div>
                  <div className="text-[10px] text-gray-900 uppercase">Next: {l.nextAction} ({format(new Date(l.nextActionDate), 'MMM d')})</div>
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col space-y-1 bg-white p-1 border border-gray-100 shadow-md rounded-lg">
                    <select 
                      className="text-[10px] bg-gray-100 border-none text-gray-900 py-1 cursor-pointer"
                      value={l.stage}
                      onChange={(e) => updateLead(l.id, { stage: e.target.value })}
                    >
                      {stages.map(s => <option key={s} value={s}>Move to {s}</option>)}
                    </select>
                    <button onClick={() => { deleteLead(l.id) }} className="text-red-500 text-[10px] text-left px-1 hover:underline cursor-pointer">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ClientsViewProps {
  clients: Client[];
}

function ClientsView({ clients }: ClientsViewProps) {
  if (clients.length === 0) return <div className="text-gray-900 italic">No clients yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-6 font-semibold">Client Name</th>
            <th className="pb-2 p-6 font-semibold">Services</th>
            <th className="pb-2 p-6 font-semibold">Contact</th>
            <th className="pb-2 p-6 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c: any) => (
            <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-6 font-medium">
                <div>{c.name}</div>
                {c.businessName && <div className="text-[10px] text-gray-900 mt-1">{c.businessName}</div>}
              </td>
              <td className="p-6">
                <div className="flex flex-wrap gap-1">
                  {c.services?.map((s: string) => (
                    <Badge key={s} variant="default">{s}</Badge>
                  ))}
                </div>
              </td>
              <td className="p-6 text-gray-900">{c.contact}</td>
              <td className="p-6">
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
}

function EngagementsView({ engagements, clients }: EngagementsViewProps) {
  if (engagements.length === 0) return <div className="text-gray-900 italic">No engagements yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-6 font-semibold">Client</th>
            <th className="pb-2 p-6 font-semibold">Terms</th>
            <th className="pb-2 p-6 font-semibold text-right">Value</th>
            <th className="pb-2 p-6 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {engagements.map((e: any) => {
            const client = clients.find((c: any) => c.id === e.clientId);
            return (
              <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-6 font-medium">{client?.name || 'Unknown'} <Badge className="ml-2">{e.brand}</Badge></td>
                <td className="p-6 text-gray-900">{e.paymentTerms} (Started {format(new Date(e.startDate), 'MMM yyyy')})</td>
                <td className="p-6 text-right tabular text-emerald-500 font-semibold">{formatCurrency(e.value)}</td>
                <td className="p-6">
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
}

function PaymentsView({ payments, clients, engagements, deletePayment }: PaymentsViewProps) {
  if (payments.length === 0) return <div className="text-gray-900 italic">No payments recorded yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-6 font-semibold">Date</th>
            <th className="pb-2 p-6 font-semibold">Client & Ref</th>
            <th className="pb-2 p-6 font-semibold text-right">Amount</th>
            <th className="pb-2 p-6"></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => {
            const client = clients.find((c: any) => c.id === p.clientId);
            return (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                <td className="p-6">
                  <div className="font-medium">{client?.name || 'Unknown'} <Badge className="ml-2">{p.brand}</Badge></div>
                  <div className="text-[10px] text-gray-900 mt-1">Ref: {p.invoiceReference}</div>
                </td>
                <td className="p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                <td className="p-6 text-right">
                  <button onClick={() => { deletePayment(p.id) }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
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
}

function ExpensesView({ expenses, deleteExpense }: ExpensesViewProps) {
  if (expenses.length === 0) return <div className="text-gray-900 italic">No business expenses recorded yet.</div>;
  return (
    <Card className="p-0 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
            <th className="pb-2 p-6 font-semibold">Date</th>
            <th className="pb-2 p-6 font-semibold">Brand & Category</th>
            <th className="pb-2 p-6 font-semibold text-right">Amount</th>
            <th className="pb-2 p-6"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e: any) => (
            <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-6 text-gray-900">{format(new Date(e.date), 'MMM d, yyyy')}</td>
              <td className="p-6">
                <Badge>{e.brand}</Badge>
                <span className="ml-2 text-gray-800">{e.category}</span>
              </td>
              <td className="p-6 text-right tabular text-red-500 font-semibold">-{formatCurrency(e.amount)}</td>
              <td className="p-6 text-right">
                <button onClick={() => { deleteExpense(e.id) }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
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
}

function LeadModal({ isOpen, onClose, onSave }: LeadModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [source, setSource] = useState('');
  const [stage, setStage] = useState('Lead');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !estimatedValue) return;
    onSave({ name, brand, source, stage, estimatedValue: parseFloat(estimatedValue), nextAction, nextActionDate });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Lead">
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
        <div><Label>Next Action Date</Label><Input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} required /></div>
        <Button type="submit" className="w-full mt-4">Save Lead</Button>
      </form>
    </Modal>
  );
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIncoming: (item: Omit<BusinessPayment, 'id' | 'createdAt'>) => void;
  onSaveOutgoing: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  clients: Client[];
  engagements: Engagement[];
}

function PaymentModal({ isOpen, onClose, onSaveIncoming, onSaveOutgoing, clients, engagements }: PaymentModalProps) {
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');
  
  const [clientId, setClientId] = useState('');
  const [engagementId, setEngagementId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceReference, setInvoiceReference] = useState('');

  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [category, setCategory] = useState<BusinessExpense['category']>('Tools');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    if (type === 'incoming') {
      if (!clientId) return;
      const client = clients.find((c: any) => c.id === clientId);
      onSaveIncoming({ clientId, engagementId, amount: parseFloat(amount), date, invoiceReference, brand: client?.brand || 'Infinity Innovations' });
    } else {
      onSaveOutgoing({ brand, category, amount: parseFloat(amount), date });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Transaction">
      <div className="flex bg-white border border-gray-200 p-1 mb-4 rounded-md">
        <button 
          type="button"
          className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${type === 'incoming' ? 'bg-white text-gray-900 shadow' : 'text-gray-900 hover:text-gray-900'}`}
          onClick={() => setType('incoming')}
        >
          Incoming
        </button>
        <button 
          type="button"
          className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${type === 'outgoing' ? 'bg-white text-gray-900 shadow' : 'text-gray-900 hover:text-gray-900'}`}
          onClick={() => setType('outgoing')}
        >
          Outgoing
        </button>
      </div>

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
            {clientId && (
              <div>
                <Label>Engagement (Optional)</Label>
                <Select value={engagementId} onChange={e => setEngagementId(e.target.value)}>
                  <option value="">None</option>
                  {engagements.filter((e: any) => e.clientId === clientId).map((e: any) => <option key={e.id} value={e.id}>{formatCurrency(e.value)} - {e.paymentTerms}</option>)}
                </Select>
              </div>
            )}
            <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
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
                <option value="Other">Other</option>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          </>
        )}
        <Button type="submit" className="w-full mt-4" disabled={type === 'incoming' && clients.length === 0}>Save {type === 'incoming' ? 'Payment' : 'Expense'}</Button>
      </form>
    </Modal>
  );
}

interface BusinessExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
}

function BusinessExpenseModal({ isOpen, onClose, onSave }: BusinessExpenseModalProps) {
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [category, setCategory] = useState<BusinessExpense['category']>('Tools');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSave({ brand, category, amount: parseFloat(amount), date });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Business Expense">
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
            <option value="Other">Other</option>
          </Select>
        </div>
        <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <Button type="submit" className="w-full mt-4">Save Expense</Button>
      </form>
    </Modal>
  );
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Client, 'id' | 'createdAt'>) => void;
}

function ClientModal({ isOpen, onClose, onSave }: ClientModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [contact, setContact] = useState('');
  const [mail, setMail] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<'Active' | 'Paused' | 'Churned'>('Active');

  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, brand, contact, mail, address, businessName, services, status });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Client">
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
        <Button type="submit" className="w-full mt-4">Save Client</Button>
      </form>
    </Modal>
  );
}

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Engagement, 'id' | 'createdAt'>) => void;
  clients: Client[];
}

function EngagementModal({ isOpen, onClose, onSave, clients }: EngagementModalProps) {
  const [clientId, setClientId] = useState('');
  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [type, setType] = useState<'Project' | 'Retainer'>('Project');
  const [paymentTerms, setPaymentTerms] = useState<'Milestones' | 'Monthly' | 'Upfront'>('Milestones');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'On Hold'>('Active');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !value) return;
    onSave({ clientId, brand, type, paymentTerms, value: parseFloat(value), status, startDate });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Engagement">
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
        <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
        
        <Button type="submit" className="w-full mt-4">Save Engagement</Button>
      </form>
    </Modal>
  );
}

