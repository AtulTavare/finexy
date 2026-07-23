import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Badge, ConfirmDialog } from '../components/ui';
import { Project } from '../types';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { ProjectModal } from '../components/modals';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, clients, engagements, businessPayments, addProject, updateProject, deleteProject } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
                <Card key={p.id} className="p-4 flex flex-col bg-white cursor-pointer" onClick={() => navigate(`/project/${p.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{p.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.title }); }} className="text-gray-900 hover:text-red-500 text-xs px-2 py-1">Delete</button>
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
                    {p.servicePricing.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {p.servicePricing.map(svc => {
                          const eng = engagements.find(e => e.projectId === p.id && e.serviceName === svc.name);
                          const paid = eng ? businessPayments.filter(bp => bp.engagementId === eng.id).reduce((s, bp) => s + bp.amount, 0) : 0;
                          const pct = eng && eng.value > 0 ? Math.min(paid / eng.value, 1) : 0;
                          const started = new Date(svc.startDate) <= new Date();
                          return (
                            <div key={svc.name} className="border-l-2 border-gray-200 pl-2">
                              <div className="flex justify-between text-[10px]">
                                <span className="font-medium text-gray-900">{svc.name}</span>
                                <span className="text-gray-500">{svc.billing === 'one-time' ? formatCurrency(svc.price) : `${formatCurrency(svc.price)}/mo`}</span>
                              </div>
                              {!started ? (
                                <div className="text-[9px] text-orange-500 font-medium">Starts {format(new Date(svc.startDate), 'MMM d')}</div>
                              ) : eng ? (
                                <div className="space-y-0.5 mt-1">
                                  <div className="w-full bg-orange-300/50 rounded-full h-1 overflow-hidden flex">
                                    <div className="bg-emerald-500 h-1 transition-all" style={{ width: `${pct * 100}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-gray-500">
                                    <span>{formatCurrency(paid)} collected</span>
                                    <span>{Math.round(pct * 100)}%</span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also mark its linked engagements as completed.`}
        onConfirm={() => { if (deleteTarget) deleteProject(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


