import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input, Select, Label, DatePicker } from './ui';
import { Brand, Client, Engagement, BusinessPayment, BusinessExpense, Project, ServicePricing } from '../types';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

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

const BRANDS: (Brand | 'All')[] = ['All', 'Infinity Innovations'];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIncoming: (item: Omit<BusinessPayment, 'id' | 'createdAt'> & { engagementId?: string }) => void;
  onUpdateIncoming?: (id: string, updates: Partial<BusinessPayment>) => void;
  onSaveOutgoing: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  onUpdateOutgoing?: (id: string, updates: Partial<BusinessExpense>) => void;
  clients: Client[];
  engagements: Engagement[];
  payments: BusinessPayment[];
  projects?: Project[];
  editItem?: BusinessPayment | null;
}

export function PaymentModal({ isOpen, onClose, onSaveIncoming, onUpdateIncoming, onSaveOutgoing, onUpdateOutgoing, clients, engagements, payments, projects, editItem }: PaymentModalProps) {
  const [type, setType] = useState<'incoming' | 'outgoing'>('incoming');

  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [invoiceReference, setInvoiceReference] = useState('');

  const [brand, setBrand] = useState<Brand>('Infinity Innovations');
  const [category, setCategory] = useState<BusinessExpense['category']>('Tools');

  const validEngagements = useMemo(
    () => engagements.filter((e: any) => e.clientId === clientId && e.projectId === projectId && e.status === 'Active' && e.serviceName),
    [engagements, clientId, projectId]
  );
  const currentEngagement = validEngagements.find((e: any) => e.id === selectedEngagementId) || validEngagements[0];
  const amountNum = parseFloat(amount) || 0;
  const collected = currentEngagement
    ? payments.filter((p: any) => p.engagementId === currentEngagement.id).reduce((s: number, p: any) => s + p.amount, 0)
    : 0;
  const projectedCollected = collected + amountNum;
  const progress = currentEngagement ? Math.min(collected / currentEngagement.value, 1) : 0;
  const projectedProgress = currentEngagement ? Math.min(projectedCollected / currentEngagement.value, 1) : 0;

  const projectClientIds = useMemo(() => {
    const ids = new Set(engagements.filter((e: any) => e.projectId === projectId).map((e: any) => e.clientId));
    return ids;
  }, [engagements, projectId]);

  useEffect(() => {
    if (editItem) {
      setType('incoming');
      const payEngagement = engagements.find((e: any) => e.id === editItem.engagementId);
      setProjectId(payEngagement?.projectId || '');
      setClientId(editItem.clientId);
      setSelectedEngagementId(editItem.engagementId || '');
      setAmount(editItem.amount.toString());
      setDate(new Date(editItem.date));
      setInvoiceReference(editItem.invoiceReference);
    } else {
      setType('incoming');
      setProjectId(''); setClientId(''); setSelectedEngagementId(''); setAmount(''); setDate(new Date()); setInvoiceReference(''); setBrand('Infinity Innovations'); setCategory('Tools');
    }
  }, [editItem, isOpen, engagements]);

  useEffect(() => {
    setClientId('');
    setSelectedEngagementId('');
  }, [projectId]);

  useEffect(() => {
    setSelectedEngagementId('');
  }, [clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    if (type === 'incoming') {
      if (editItem && onUpdateIncoming) {
        onUpdateIncoming(editItem.id, { clientId, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), invoiceReference });
      } else {
        if (!clientId || !projectId) return;
        const client = clients.find((c: any) => c.id === clientId);
        const finalEngagementId = selectedEngagementId || (validEngagements.length === 1 ? validEngagements[0].id : undefined);
        onSaveIncoming({ clientId, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), invoiceReference, brand: client?.brand || 'Infinity Innovations', engagementId: finalEngagementId });
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
              <Label>Project</Label>
              <Select value={projectId} onChange={e => setProjectId(e.target.value)} required={!editItem}>
                <option value="">Select a project...</option>
                {(projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
            </div>
            {projectId && (
              <div>
                <Label>Client</Label>
                <Select value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Select a client...</option>
                  {clients.filter((c: any) => projectClientIds.has(c.id)).map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
                </Select>
              </div>
            )}
            {clientId && validEngagements.length > 0 ? (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {validEngagements.length > 1 && (
                  <div className="flex gap-2">
                    {validEngagements.map((e: any) => (
                      <button
                        key={e.id}
                        type="button"
                        className={`flex-1 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${selectedEngagementId === e.id || (!selectedEngagementId && validEngagements[0].id === e.id) ? 'bg-[#18181b] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}
                        onClick={() => setSelectedEngagementId(e.id)}
                      >
                        {e.serviceName}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  {amountNum > 0 ? (
                    <span className="text-gray-500">{formatCurrency(collected)} + <span className="text-orange-500 font-medium">{formatCurrency(amountNum)}</span> → {formatCurrency(projectedCollected)} of {formatCurrency(currentEngagement?.value || 0)}</span>
                  ) : (
                    <span className="text-gray-500">{formatCurrency(collected)} collected of {formatCurrency(currentEngagement?.value || 0)}</span>
                  )}
                  <span className="font-semibold text-gray-800">{Math.round(projectedProgress * 100)}%</span>
                </div>
                <div className="w-full bg-orange-300/50 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-2 transition-all" style={{ width: `${progress * 100}%` }} />
                  {amountNum > 0 && projectedProgress > progress && (
                    <div className="bg-orange-500 h-2 transition-all" style={{ width: `${(projectedProgress - progress) * 100}%` }} />
                  )}
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
        <Button type="submit" className="w-full mt-4" disabled={type === 'incoming' && (!projectId || !clientId) && !editItem}>{editItem ? 'Update Payment' : `Save ${type === 'incoming' ? 'Payment' : 'Expense'}`}</Button>
      </form>
    </Modal>
  );
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Project>) => void;
  clients: Client[];
  editItem?: Project | null;
}

export function ProjectModal({ isOpen, onClose, onSave, onUpdate, clients, editItem }: ProjectModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [servicePricing, setServicePricing] = useState<ServicePricing[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Under Review' | 'Completed'>('Not Started');

  const oneTimeTotal = useMemo(() => servicePricing.filter(s => s.billing === 'one-time').reduce((sum, s) => sum + s.price, 0), [servicePricing]);
  const monthlyTotal = useMemo(() => servicePricing.filter(s => s.billing === 'monthly').reduce((sum, s) => sum + s.price, 0), [servicePricing]);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setClientId(editItem.clientId);
      setServicePricing(editItem.servicePricing || []);
      setStartDate(new Date(editItem.startDate));
      setDeadline(new Date(editItem.deadline));
      setStatus(editItem.status);
    } else {
      setTitle(''); setClientId(''); setServicePricing([]); setStartDate(new Date()); setDeadline(new Date()); setStatus('Not Started');
    }
  }, [editItem, isOpen]);

  const toggleService = (s: string) => {
    setServicePricing(prev => {
      const existing = prev.find(p => p.name === s);
      if (existing) return prev.filter(p => p.name !== s);
      return [{ name: s, price: 0, billing: 'one-time', startDate: format(startDate || new Date(), 'yyyy-MM-dd') }, ...prev];
    });
  };

  const updatePrice = (name: string, price: number) => {
    setServicePricing(prev => prev.map(p => p.name === name ? { ...p, price } : p));
  };

  const updateBilling = (name: string, billing: 'one-time' | 'monthly') => {
    setServicePricing(prev => prev.map(p => p.name === name ? { ...p, billing } : p));
  };

  const updateStartDate = (name: string, date: Date) => {
    setServicePricing(prev => prev.map(p => p.name === name ? { ...p, startDate: format(date, 'yyyy-MM-dd') } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const services = servicePricing.map(s => s.name);
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { title, services, servicePricing, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status });
    } else {
      if (!clientId) return;
      onSave({ title, clientId, services, servicePricing, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Project' : 'Add Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Project Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div>
          <Label>Client</Label>
          <select 
            value={clientId} 
            onChange={e => setClientId(e.target.value)} 
            required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Client...</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Start Date</Label><DatePicker value={startDate} onChange={setStartDate} /></div>
          <div><Label>Deadline</Label><DatePicker value={deadline} onChange={setDeadline} /></div>
        </div>
        <div>
          <Label>Status</Label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value as any)}
            className="w-full bg-gray-100 border border-gray-200 rounded-md p-2 text-sm text-gray-900 focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <Label>Services &amp; Pricing</Label>
          <div className="mt-2 space-y-3 max-h-56 overflow-y-auto no-scrollbar p-3 border border-gray-200 bg-white rounded-md">
            {SERVICES_OFFERED.map(s => {
              const pricing = servicePricing.find(p => p.name === s);
              return (
                <div key={s} className="flex items-center gap-2 text-xs flex-wrap">
                  <input 
                    type="checkbox" 
                    checked={!!pricing}
                    onChange={() => toggleService(s)}
                    className="rounded border-gray-200 bg-white text-green-500 focus:ring-green-400 shrink-0"
                  />
                  <span className="text-gray-800 min-w-[100px]">{s}</span>
                  {pricing && (
                    <>
                      <span className="text-gray-400">₹</span>
                      <input
                        type="number"
                        value={pricing.price || ''}
                        onChange={e => updatePrice(s, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      <div className="flex bg-gray-100 rounded-md p-0.5">
                        <button
                          type="button"
                          className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${pricing.billing === 'one-time' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                          onClick={() => updateBilling(s, 'one-time')}
                        >
                          One-time
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${pricing.billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                          onClick={() => updateBilling(s, 'monthly')}
                        >
                          Monthly
                        </button>
                      </div>
                      <label className="flex items-center gap-1 text-gray-500">
                        <span>From:</span>
                        <input
                          type="date"
                          value={pricing.startDate}
                          onChange={e => updateStartDate(s, new Date(e.target.value + 'T00:00:00'))}
                          className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-900 text-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </label>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {servicePricing.length > 0 && (
            <div className="flex justify-between text-xs font-semibold text-gray-900 mt-2 px-1">
              <span>One-time: ₹{oneTimeTotal.toLocaleString('en-IN')}</span>
              <span>Monthly: ₹{monthlyTotal.toLocaleString('en-IN')}/mo</span>
            </div>
          )}
        </div>
        
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Project' : 'Save Project'}</Button>
      </form>
    </Modal>
  );
}
