import React, { useState, useEffect } from 'react';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Label, Modal, Badge, DatePicker } from '../components/ui';
import { Client, Project } from '../types';
import { format } from 'date-fns';

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
  const { projects, clients, addProject, updateProject, deleteProject } = useData();
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
  const [services, setServices] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Under Review' | 'Completed'>('Not Started');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title); setClientId(editItem.clientId); setServices(editItem.services); setStartDate(new Date(editItem.startDate)); setDeadline(new Date(editItem.deadline)); setStatus(editItem.status);
    } else {
      setTitle(''); setClientId(''); setServices([]); setStartDate(new Date()); setDeadline(new Date()); setStatus('Not Started');
    }
  }, [editItem, isOpen]);

  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { title, services, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status });
    } else {
      if (!clientId) return;
      onSave({ title, clientId, services, startDate: format(startDate, 'yyyy-MM-dd'), deadline: format(deadline, 'yyyy-MM-dd'), status });
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
          <Label>Services</Label>
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
        
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Project' : 'Save Project'}</Button>
      </form>
    </Modal>
  );
}
