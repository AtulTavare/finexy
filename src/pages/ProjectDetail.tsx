import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Badge, ConfirmDialog, Input, Textarea, Select, Label, Modal, DatePicker } from '../components/ui';
import { ProjectModal, PaymentModal } from '../components/modals';
import { formatCurrency, generateId } from '../lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { ArrowLeft, Trash2, Plus, Pencil, X, Check, Upload, Download, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import type { Milestone, ProcessStep, Installment } from '../types';

function serviceTotalValue(svc: { price: number; billing: string; startDate: string; endDate?: string }): number {
  if (svc.billing === 'one-time') return svc.price;
  if (!svc.endDate) return svc.price;
  const months = differenceInMonths(new Date(svc.endDate), new Date(svc.startDate)) + 1;
  return svc.price * Math.max(1, months);
}

const MILESTONE_PRESETS: Record<string, Omit<Milestone, 'status'>[]> = {
  'Website Development': [
    { title: 'Discovery & Planning', description: 'Requirements gathering, sitemap, tech stack selection', dueDate: '' },
    { title: 'Design Phase', description: 'Wireframes, mockups, brand alignment, client review', dueDate: '' },
    { title: 'Development Phase', description: 'Frontend & backend build, integrations', dueDate: '' },
    { title: 'Testing & QA', description: 'Cross-browser testing, load testing, bug fixes', dueDate: '' },
    { title: 'Launch & Deploy', description: 'DNS configuration, go-live, post-launch monitoring', dueDate: '' },
  ],
  'App Development': [
    { title: 'Discovery & Planning', description: 'Feature list, user flows, technical architecture', dueDate: '' },
    { title: 'Design (UI/UX)', description: 'App prototypes, design system, user testing', dueDate: '' },
    { title: 'Development', description: 'App build (iOS/Android/web), API integration', dueDate: '' },
    { title: 'Internal Testing', description: 'Beta testing, bug fixes, performance tuning', dueDate: '' },
    { title: 'App Store Submission', description: 'Store assets, submission, launch', dueDate: '' },
  ],
  'AI Automation': [
    { title: 'Process Audit', description: 'Map current workflow, identify automation opportunities', dueDate: '' },
    { title: 'Solution Design', description: 'AI agent architecture, integration plan', dueDate: '' },
    { title: 'Development & Integration', description: 'Build agents, connect APIs, configure workflows', dueDate: '' },
    { title: 'Testing & Training', description: 'UAT, team training, documentation', dueDate: '' },
    { title: 'Go Live & Monitor', description: 'Production deployment, performance monitoring', dueDate: '' },
  ],
  'Digital Marketing': [
    { title: 'Strategy & Research', description: 'Market research, competitor analysis, KPI definition', dueDate: '' },
    { title: 'Campaign Setup', description: 'Channel setup, ad creative, targeting configuration', dueDate: '' },
    { title: 'Launch & Optimize', description: 'Campaign launch, A/B testing, bid optimization', dueDate: '' },
    { title: 'Reporting & Review', description: 'Performance report, insights, strategy adjustment', dueDate: '' },
  ],
};

function EditableSection({ title, editing, onToggle, onCancel, onSave, children }: {
  title: string; editing: boolean; onToggle: () => void; onCancel: () => void; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={onCancel} className="text-xs px-3 py-1.5 min-h-[36px]">Cancel</Button>
              <Button onClick={onSave} className="text-xs px-3 py-1.5 min-h-[36px]"><Check size={14} className="mr-1" /> Save</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onToggle} className="text-xs px-3 py-1.5 min-h-[36px]"><Pencil size={14} className="mr-1" /> Edit</Button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects, addProject, updateProject, deleteProject,
    clients, businessPayments, meetings, documents, installments,
    addBusinessPayment, updateBusinessPayment, deleteBusinessPayment,
    businessExpenses, addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
    addMeeting, updateMeeting, deleteMeeting,
    addDocument, deleteDocument,
    addInstallment, updateInstallment, deleteInstallment,
  } = useData();

  const project = projects.find(p => p.id === id);
  const client = project ? clients.find(c => c.id === project.clientId) : null;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteMeetingTarget, setDeleteMeetingTarget] = useState<{ id: string; title: string } | null>(null);
  const [showInstallmentCreate, setShowInstallmentCreate] = useState(false);
  const [showInstallmentPaid, setShowInstallmentPaid] = useState<Installment | null>(null);
  const [instPaidAmount, setInstPaidAmount] = useState('');
  const [instPaidDate, setInstPaidDate] = useState(new Date());
  const [instPaidRef, setInstPaidRef] = useState('');

  const [editOverview, setEditOverview] = useState(false);
  const [overviewVal, setOverviewVal] = useState('');

  const [editSteps, setEditSteps] = useState(false);
  const [stepsVal, setStepsVal] = useState<ProcessStep[]>([]);

  const [editMilestones, setEditMilestones] = useState(false);
  const [milestonesVal, setMilestonesVal] = useState<Milestone[]>([]);
  const [showPresets, setShowPresets] = useState(false);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');

  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Project not found</h2>
        <Button onClick={() => navigate('/admin-730If1Q5/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const totalBudget = project.servicePricing.reduce((sum, s) => sum + serviceTotalValue(s), 0);
  const totalPaid = businessPayments.filter(p => p.projectId === project.id).reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalBudget - totalPaid);
  const pct = totalBudget > 0 ? Math.min(totalPaid / totalBudget, 1) : 0;

  const projectPayments = businessPayments.filter(p => p.projectId === project.id);
  const clientMeetings = meetings.filter(m => m.clientId === project.clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextMeeting = clientMeetings.find(m => new Date(m.date) >= new Date());
  const pastMeetings = clientMeetings.filter(m => new Date(m.date) < new Date());
  const clientDocs = documents.filter(d => d.clientId === project.clientId);
  const projectInstallments = installments.filter(i => i.projectId === project.id).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/admin-730If1Q5/projects', { replace: true });
  };

  const startEditOverview = () => {
    setOverviewVal(project.overview || '');
    setEditOverview(true);
  };

  const saveOverview = () => {
    updateProject(project.id, { overview: overviewVal });
    setEditOverview(false);
  };

  const startEditSteps = () => {
    setStepsVal(project.processSteps || []);
    setEditSteps(true);
  };

  const saveSteps = () => {
    updateProject(project.id, { processSteps: stepsVal });
    setEditSteps(false);
  };

  const addStep = () => {
    setStepsVal(prev => [...prev, { title: '', description: '', order: prev.length, startDate: '', endDate: '', status: 'Pending' }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    setStepsVal(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeStep = (index: number) => {
    setStepsVal(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const startEditMilestones = () => {
    setMilestonesVal(project.milestones || []);
    setEditMilestones(true);
  };

  const saveMilestones = () => {
    updateProject(project.id, { milestones: milestonesVal });
    setEditMilestones(false);
  };

  const addMilestone = () => {
    setMilestonesVal(prev => [...prev, { title: '', description: '', dueDate: '', status: 'Pending' }]);
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    setMilestonesVal(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMilestone = (index: number) => {
    setMilestonesVal(prev => prev.filter((_, i) => i !== index));
  };

  const applyPreset = (name: string) => {
    const preset = MILESTONE_PRESETS[name];
    if (!preset) return;
    setMilestonesVal(prev => [...prev, ...preset.map(m => ({ ...m, status: 'Pending' as const }))]);
    setShowPresets(false);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client || !user) return;

    setUploadingDoc(true);
    setDocUploadError('');
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${client.id}/${generateId()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('client-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage.from('client-documents').createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (!urlData?.signedUrl) throw new Error('Failed to generate signed URL');

      await addDocument({
        clientId: client.id,
        name: file.name,
        type: file.type,
        fileUrl: urlData.signedUrl,
        uploadedBy: 'admin',
      });
    } catch (err) {
      console.error('Upload failed', err);
      setDocUploadError('Upload failed. Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin-730If1Q5/projects')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 w-fit">
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

      <EditableSection title="Overview" editing={editOverview} onToggle={startEditOverview} onCancel={() => setEditOverview(false)} onSave={saveOverview}>
        {editOverview ? (
          <Textarea value={overviewVal} onChange={e => setOverviewVal(e.target.value)} placeholder="Describe the project scope, goals, and key details..." />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.overview || <span className="text-gray-400 italic">No overview added yet.</span>}</p>
        )}
      </EditableSection>

      <Card className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Services &amp; Pricing</h2>
        <div className="space-y-4">
          {project.servicePricing.map(svc => {
            const sTotal = serviceTotalValue(svc);
            const paid = businessPayments.filter(p => p.projectId === project.id && p.serviceName === svc.name).reduce((sum, p) => sum + p.amount, 0);
            const sPct = sTotal > 0 ? Math.min(paid / sTotal, 1) : 0;
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
                    {svc.billing === 'monthly' && svc.endDate && <span className="text-[10px] text-gray-400 ml-1 font-normal">({formatCurrency(sTotal)} total)</span>}
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

      <EditableSection title="Process Timeline" editing={editSteps} onToggle={startEditSteps} onCancel={() => setEditSteps(false)} onSave={saveSteps}>
        {editSteps ? (
          <div className="space-y-4">
            {stepsVal.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Step {i + 1}</span>
                  <button onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Title</Label><Input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} placeholder="e.g. Discovery Phase" /></div>
                  <div><Label>Status</Label>
                    <Select value={step.status} onChange={e => updateStep(i, 'status', e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </Select>
                  </div>
                  <div><Label>Start Date</Label><Input type="date" value={step.startDate} onChange={e => updateStep(i, 'startDate', e.target.value)} /></div>
                  <div><Label>End Date</Label><Input type="date" value={step.endDate || ''} onChange={e => updateStep(i, 'endDate', e.target.value)} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={step.description || ''} onChange={e => updateStep(i, 'description', e.target.value)} /></div>
              </div>
            ))}
            <Button variant="secondary" onClick={addStep} className="w-full"><Plus size={14} className="mr-1" /> Add Step</Button>
          </div>
        ) : (
          <div className="space-y-0">
            {(project.processSteps || []).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No process steps defined yet.</p>
            ) : (
              (project.processSteps || []).sort((a, b) => a.order - b.order).map((step, i) => (
                <div key={i} className="flex gap-4 pb-6 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${step.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : step.status === 'In Progress' ? 'bg-orange-400 border-orange-400' : 'border-gray-300'}`}>
                      <div className={`w-2 h-2 rounded-full ${step.status === 'Completed' ? 'bg-white' : step.status === 'In Progress' ? 'bg-white' : 'bg-gray-300'}`} />
                    </div>
                    {i < (project.processSteps || []).length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 -mt-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                        <Badge className="ml-2" variant={step.status === 'Completed' ? 'success' : step.status === 'In Progress' ? 'warning' : 'default'}>{step.status}</Badge>
                      </div>
                      {step.startDate && <span className="text-[10px] text-gray-500">{step.startDate}{step.endDate ? ` → ${step.endDate}` : ''}</span>}
                    </div>
                    {step.description && <p className="text-xs text-gray-600 mt-1">{step.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </EditableSection>

      <EditableSection title="Milestones" editing={editMilestones} onToggle={startEditMilestones} onCancel={() => setEditMilestones(false)} onSave={saveMilestones}>
        {editMilestones ? (
          <div className="space-y-4">
            {milestonesVal.map((m, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Milestone {i + 1}</span>
                  <button onClick={() => removeMilestone(i)} className="text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Title</Label><Input value={m.title} onChange={e => updateMilestone(i, 'title', e.target.value)} placeholder="e.g. MVP Launch" /></div>
                  <div><Label>Status</Label>
                    <Select value={m.status} onChange={e => updateMilestone(i, 'status', e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </Select>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" value={m.dueDate} onChange={e => updateMilestone(i, 'dueDate', e.target.value)} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={m.description || ''} onChange={e => updateMilestone(i, 'description', e.target.value)} /></div>
              </div>
            ))}
            <div className="flex gap-2">
              <div className="relative">
                <Button variant="secondary" onClick={() => setShowPresets(!showPresets)} className="text-xs px-3 py-1.5 min-h-[36px]"><ChevronDown size={14} className="mr-1" /> Presets</Button>
                {showPresets && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[180px] overflow-hidden">
                    {Object.keys(MILESTONE_PRESETS).map(name => (
                      <button
                        key={name}
                        onClick={() => applyPreset(name)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="secondary" onClick={addMilestone} className="text-xs px-3 py-1.5 min-h-[36px]"><Plus size={14} className="mr-1" /> Add Milestone</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(project.milestones || []).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No milestones defined yet.</p>
            ) : (
              (project.milestones || []).map((m, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : m.status === 'In Progress' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    <div className="text-[10px] font-bold">{m.status === 'Completed' ? '✓' : m.status === 'In Progress' ? '◉' : '○'}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-900">{m.title}</span>
                      <div className="flex items-center gap-2">
                        {m.dueDate && <span className="text-[10px] text-gray-500">Due {format(new Date(m.dueDate), 'MMM d, yyyy')}</span>}
                        <Badge variant={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'warning' : 'default'}>{m.status}</Badge>
                      </div>
                    </div>
                    {m.description && <p className="text-xs text-gray-600 mt-0.5">{m.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </EditableSection>

      <Card className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Meetings</h2>
          <Button variant="secondary" onClick={() => setShowMeetingModal(true)} className="text-xs px-3 py-1.5 min-h-[36px]">
            <Plus size={14} className="mr-1" /> Schedule Meeting
          </Button>
        </div>
        {nextMeeting && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-orange-600 font-semibold mb-1">Next Meeting</div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-gray-900">{nextMeeting.title}</span>
                <span className="text-xs text-gray-500 ml-2">{format(new Date(nextMeeting.date), 'MMM d, yyyy')} at {nextMeeting.time}</span>
              </div>
              {nextMeeting.reason && <span className="text-xs text-gray-600">{nextMeeting.reason}</span>}
            </div>
          </div>
        )}
        {clientMeetings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No meetings scheduled with this client.</p>
        ) : (
          <div className="space-y-2">
            {clientMeetings.map(m => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{m.title}</span>
                    <span className="text-xs text-gray-500 ml-2">{format(new Date(m.date), 'MMM d, yyyy')} at {m.time}</span>
                    {m.reason && <span className="text-xs text-gray-400 ml-2">— {m.reason}</span>}
                  </div>
                </div>
                <button onClick={() => setDeleteMeetingTarget({ id: m.id, title: m.title })} className="text-gray-400 hover:text-red-500 cursor-pointer p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Installments / Payment Schedule</h2>
          <Button variant="secondary" className="text-xs px-3 py-1.5 min-h-[36px]" onClick={() => setShowInstallmentCreate(true)}>
            <Plus size={14} className="mr-1" /> Add Installment
          </Button>
        </div>
        {projectInstallments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No installments scheduled for this project.</p>
        ) : (
          <div className="space-y-2">
            {projectInstallments.map(inst => {
              const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date();
              const status = isOverdue ? 'overdue' : inst.status;
              return (
                <div key={inst.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${status === 'paid' ? 'bg-emerald-400' : status === 'overdue' ? 'bg-red-400' : 'bg-gray-300'}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{inst.serviceName}</span>
                      <span className="text-xs text-gray-500 ml-2">Due {format(new Date(inst.dueDate), 'MMM d, yyyy')}</span>
                      {inst.paidDate && <span className="text-xs text-gray-400 ml-2">Paid {format(new Date(inst.paidDate), 'MMM d, yyyy')}</span>}
                      {inst.note && <span className="text-xs text-gray-400 ml-2">— {inst.note}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-sm tabular font-semibold text-gray-900">{formatCurrency(inst.amount)}</span>
                    <Badge variant={status === 'paid' ? 'success' : status === 'overdue' ? 'error' : 'secondary'}>{status}</Badge>
                    {status !== 'paid' && (
                      <button onClick={() => { setShowInstallmentPaid(inst); setInstPaidAmount(inst.amount.toString()); setInstPaidDate(new Date()); setInstPaidRef(''); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">Mark Paid</button>
                    )}
                    {status === 'paid' && (
                      <button onClick={() => deleteInstallment(inst.id)} className="text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
          <div>
            {docUploadError && <p className="text-xs text-red-500 mb-2">{docUploadError}</p>}
            <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 min-h-[36px]">
              <Upload size={14} className="mr-1" /> {uploadingDoc ? 'Uploading...' : 'Upload'}
              <input type="file" className="hidden" onChange={handleDocUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" disabled={uploadingDoc} />
            </label>
          </div>
        </div>
        {clientDocs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No documents shared yet.</p>
        ) : (
          <div className="space-y-2">
            {clientDocs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Download size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{format(new Date(doc.createdAt), 'MMM d, yyyy')} · {doc.uploadedBy}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 p-1">
                    <Download size={14} />
                  </a>
                  <button onClick={() => setShowDeleteDocConfirm(doc.id)} className="text-gray-400 hover:text-red-500 cursor-pointer p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Payment History</h2>
          <Button onClick={() => setShowPaymentModal(true)} variant="secondary" className="text-xs px-3 py-1.5 min-h-[36px]">
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
              {projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 md:p-6 text-gray-900">{format(new Date(p.date), 'MMM d, yyyy')}</td>
                  <td className="p-4 md:p-6">
                    <span className="text-gray-900">{p.serviceName}</span>
                  </td>
                  <td className="p-4 md:p-6 text-gray-500 hidden sm:table-cell">{p.invoiceReference || '—'}</td>
                  <td className="p-4 md:p-6 text-right tabular text-emerald-500 font-semibold">+{formatCurrency(p.amount)}</td>
                  <td className="p-4 md:p-6 text-right">
                    <button onClick={() => deleteBusinessPayment(p.id)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
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
        payments={businessPayments}
        projects={projects}
        onSaveInstallment={addInstallment}
      />

      <Modal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} title="Schedule Meeting">
        <MeetingForm
          clientId={project.clientId}
          clientName={client?.name || ''}
          onSave={addMeeting}
          onClose={() => setShowMeetingModal(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Linked payments will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteMeetingTarget}
        title="Delete Meeting"
        message={`Delete "${deleteMeetingTarget?.title}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteMeetingTarget) { deleteMeeting(deleteMeetingTarget.id); setDeleteMeetingTarget(null); } }}
        onCancel={() => setDeleteMeetingTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!showDeleteDocConfirm}
        title="Delete Document"
        message="Remove this document? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (showDeleteDocConfirm) { deleteDocument(showDeleteDocConfirm); setShowDeleteDocConfirm(null); } }}
        onCancel={() => setShowDeleteDocConfirm(null)}
      />

      <Modal isOpen={showInstallmentCreate} onClose={() => setShowInstallmentCreate(false)} title="Create Installment">
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.target as HTMLFormElement);
          const svc = f.get('svc') as string;
          const amt = parseFloat(f.get('amt') as string);
          const due = f.get('due') as string;
          if (!svc || !amt || !due) return;
          addInstallment({
            clientId: project.clientId,
            projectId: project.id,
            serviceName: svc,
            amount: amt,
            dueDate: due,
            status: 'pending',
            note: (f.get('note') as string) || undefined,
          });
          setShowInstallmentCreate(false);
        }} className="space-y-4">
          <div>
            <Label>Service</Label>
            <select name="svc" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
              {(project.servicePricing || []).map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div><Label>Amount (₹)</Label><Input name="amt" type="number" step="0.01" required /></div>
          <div><Label>Due Date</Label><Input name="due" type="date" required /></div>
          <div><Label>Note (optional)</Label><Input name="note" /></div>
          <Button type="submit" className="w-full">Create Installment</Button>
        </form>
      </Modal>

      <Modal isOpen={!!showInstallmentPaid} onClose={() => setShowInstallmentPaid(null)} title="Mark Installment as Paid">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!showInstallmentPaid) return;
          const amt = parseFloat(instPaidAmount);
          if (!amt) return;
          addBusinessPayment({
            clientId: project.clientId,
            projectId: project.id,
            serviceName: showInstallmentPaid.serviceName,
            amount: amt,
            date: format(instPaidDate, 'yyyy-MM-dd'),
            invoiceReference: instPaidRef || `INST-${showInstallmentPaid.id.slice(0, 6)}`,
            brand: client?.brand || 'Infinity Innovations',
          });
          updateInstallment(showInstallmentPaid.id, {
            status: 'paid',
            paidDate: format(instPaidDate, 'yyyy-MM-dd'),
            invoiceReference: instPaidRef || undefined,
          });
          setShowInstallmentPaid(null);
        }} className="space-y-4">
          <div><Label>Amount (₹)</Label><Input type="number" step="0.01" value={instPaidAmount} onChange={e => setInstPaidAmount(e.target.value)} required /></div>
          <div><Label>Payment Date</Label><DatePicker value={instPaidDate} onChange={setInstPaidDate} /></div>
          <div><Label>Invoice Reference</Label><Input value={instPaidRef} onChange={e => setInstPaidRef(e.target.value)} /></div>
          <Button type="submit" className="w-full">Save Payment</Button>
        </form>
      </Modal>
    </div>
  );
}

function MeetingForm({ clientId, clientName, onSave, onClose }: {
  clientId: string; clientName: string; onSave: (item: any) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || `${clientName} Meeting`,
      clientId,
      date,
      time,
      reason: reason || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder={`${clientName} Meeting`} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} required /></div>
      </div>
      <div><Label>Reason / Agenda</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional notes about this meeting..." /></div>
      <Button type="submit" className="w-full">Schedule Meeting</Button>
    </form>
  );
}