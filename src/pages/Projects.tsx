import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Label, Modal, Badge, DatePicker } from '../components/ui';
import { Client, Project, ServicePricing } from '../types';
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

export default function Projects() {
  const { projects, clients, engagements, businessPayments, addProject, updateProject, deleteProject } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage active projects and timelines.</p>
        </div>
        <div className="flex w-full md:w-auto">
          <Button className="w-full md:w-auto" onClick={() => setShowModal(true)}>+ Add Project</Button>
        </div>
      </div>

      <div>
        {projects.length === 0 ? (
          <div className="text-gray-900 italic">No projects yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const client = clients.find(c => c.id === p.clientId);
              return (
                <Card key={p.id} className="p-4 flex flex-col bg-white cursor-pointer" onClick={() => { setEditingProject(p); setShowModal(true); }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{p.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="text-gray-900 hover:text-red-500 text-xs px-2 py-1">Delete</button>
                  </div>
                  <div className="text-sm text-gray-900 mb-4">{client?.name || 'Unknown Client'}</div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.services.map(s => <Badge key={s} variant="default">{s}</Badge>)}
                  </div>

                  <div className="mt-auto space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Status</span>
                      <Badge variant={p.status === 'Completed' ? 'success' : p.status === 'In Progress' ? 'warning' : 'secondary'}>{p.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Timeline</span>
                      <span>{format(new Date(p.startDate), 'MMM d')} - {format(new Date(p.deadline), 'MMM d')}</span>
                    </div>
                    {(() => {
                      const totalBudget = p.oneTimeBudget + p.monthlyBudget;
                      if (totalBudget <= 0) return null;
                      const engs = engagements.filter(e => e.clientId === p.clientId && e.status === 'Active');
                      const paid = engs.reduce((sum, eng) => sum + businessPayments.filter(bp => bp.engagementId === eng.id).reduce((s, bp) => s + bp.amount, 0), 0);
                      const pct = Math.min(paid / totalBudget, 1);
                      return (
                        <div className="space-y-1 pt-2">
                          {p.oneTimeBudget > 0 && <div className="text-[10px] text-gray-500">One-time: {formatCurrency(p.oneTimeBudget)}</div>}
                          {p.monthlyBudget > 0 && <div className="text-[10px] text-gray-500">Monthly: {formatCurrency(p.monthlyBudget)}/mo</div>}
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">{formatCurrency(paid)} collected</span>
                            <span className="font-semibold">{formatCurrency(totalBudget)} total</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct * 100}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                    <select 
                      value={p.status} 
                      onChange={e => updateProject(p.id, { status: e.target.value as any })}
                      className="bg-transparent text-xs font-semibold text-emerald-500 cursor-pointer outline-none"
                    >
                      <option value="Not Started" className="bg-gray-100 text-gray-900">Not Started</option>
                      <option value="In Progress" className="bg-gray-100 text-gray-900">In Progress</option>
                      <option value="Under Review" className="bg-gray-100 text-gray-900">Under Review</option>
                      <option value="Completed" className="bg-gray-100 text-gray-900">Completed</option>
                    </select>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProjectModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingProject(null); }} 
        onSave={addProject}
        onUpdate={updateProject}
        clients={clients}
        editItem={editingProject}
      />
    </div>
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

function ProjectModal({ isOpen, onClose, onSave, onUpdate, clients, editItem }: ProjectModalProps) {
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
      return [...prev, { name: s, price: 0, billing: 'one-time' }];
    });
  };

  const updatePrice = (name: string, price: number) => {
    setServicePricing(prev => prev.map(p => p.name === name ? { ...p, price } : p));
  };

  const updateBilling = (name: string, billing: 'one-time' | 'monthly') => {
    setServicePricing(prev => prev.map(p => p.name === name ? { ...p, billing } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const services = servicePricing.map(s => s.name);
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { title, services, servicePricing, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status, budget: 0, oneTimeBudget: oneTimeTotal, monthlyBudget: monthlyTotal });
    } else {
      if (!clientId) return;
      onSave({ title, clientId, services, servicePricing, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status, budget: 0, oneTimeBudget: oneTimeTotal, monthlyBudget: monthlyTotal });
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
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto no-scrollbar p-3 border border-gray-200 bg-white rounded-md">
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
