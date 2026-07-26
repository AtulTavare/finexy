import { useParams, useNavigate } from 'react-router-dom';
import { useClientData } from '../../store/ClientDataContext';
import { Card, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { ArrowLeft, Download, CircleDot } from 'lucide-react';
import type { Milestone } from '../../types';

function serviceTotalValue(svc: { price: number; billing: string; startDate: string; endDate?: string }): number {
  if (svc.billing === 'one-time') return svc.price;
  if (!svc.endDate) return svc.price;
  const months = differenceInMonths(new Date(svc.endDate), new Date(svc.startDate)) + 1;
  return svc.price * Math.max(1, months);
}

function currentMilestone(milestones: Milestone[]): Milestone | null {
  const ip = milestones.find(m => m.status === 'In Progress');
  if (ip) return ip;
  return milestones.find(m => m.status === 'Pending') || null;
}

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, businessPayments, documents, meetings, loading } = useClientData();

  const project = projects.find(p => p.id === id);

  if (loading) {
    return <div className="text-gray-400 italic">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Project not found</h2>
        <button onClick={() => navigate('/client/projects')} className="text-sm text-gray-500 hover:text-gray-900 underline">Back to Projects</button>
      </div>
    );
  }

  const totalBudget = project.servicePricing.reduce((sum, s) => sum + serviceTotalValue(s), 0);
  const totalPaid = businessPayments.filter(p => p.projectId === project.id).reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalBudget - totalPaid);
  const pct = totalBudget > 0 ? Math.min(totalPaid / totalBudget, 1) : 0;

  const projectPayments = businessPayments.filter(p => p.projectId === project.id);
  const clientDocs = documents.filter(d => d.clientId === project.clientId);
  const clientMeetings = meetings.filter(m => m.clientId === project.clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextMeeting = clientMeetings.find(m => new Date(m.date) >= new Date());

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/client/projects')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 w-fit">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{project.title}</h1>
        <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'warning' : 'secondary'}>{project.status}</Badge>
        {(() => {
          const cm = currentMilestone(project.milestones || []);
          return cm ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              <CircleDot size={10} />
              {cm.status === 'In Progress' ? '' : 'Next: '}{cm.title}
            </span>
          ) : null;
        })()}
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

      {project.overview && (
        <Card className="p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Overview</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.overview}</p>
        </Card>
      )}

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

      {(project.milestones || []).length > 0 && (
        <Card className="p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Milestones</h2>
          <div className="flex items-center gap-1.5 mb-4">
            {project.milestones!.map((m, i) => {
              const isCompleted = m.status === 'Completed';
              const isInProgress = m.status === 'In Progress';
              return (
                <div key={i} className="flex items-center gap-0">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isCompleted ? 'bg-emerald-500' :
                      isInProgress ? 'bg-orange-400 animate-pulse' :
                      'bg-gray-200'
                    }`}
                    title={m.title}
                  />
                  {i < project.milestones!.length - 1 && (
                    <div className={`w-6 sm:w-10 h-0.5 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
            <span className="text-[10px] text-gray-400 ml-1">
              {project.milestones!.filter(m => m.status === 'Completed').length}/{project.milestones!.length}
            </span>
          </div>
          <div className="space-y-2">
            {project.milestones!.map((m, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-2 last:border-b-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : m.status === 'In Progress' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                  <div className="text-[9px] font-bold">{m.status === 'Completed' ? '✓' : m.status === 'In Progress' ? '◉' : '○'}</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-900">{m.title}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {m.dueDate && <span className="text-[10px] text-gray-500 whitespace-nowrap">Due {format(new Date(m.dueDate), 'MMM d, yyyy')}</span>}
                      <Badge variant={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'warning' : 'default'}>{m.status}</Badge>
                    </div>
                  </div>
                  {m.description && <p className="text-xs text-gray-600 mt-0.5">{m.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(project.processSteps || []).length > 0 && (
        <Card className="p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Process Timeline</h2>
          <div className="space-y-0">
            {(project.processSteps || []).sort((a, b) => a.order - b.order).map((step, i) => (
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
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Meetings</h2>
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
          <p className="text-sm text-gray-400 italic">No meetings scheduled.</p>
        ) : (
          <div className="space-y-2">
            {clientMeetings.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{m.title}</span>
                  <span className="text-xs text-gray-500 ml-2">{format(new Date(m.date), 'MMM d, yyyy')} at {m.time}</span>
                  {m.reason && <span className="text-xs text-gray-400 ml-2">— {m.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Documents</h2>
        {clientDocs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No documents shared yet.</p>
        ) : (
          <div className="space-y-2">
            {clientDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Download size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Download</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment History</h2>
        {projectPayments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-900">{p.serviceName}</span>
                  <span className="text-xs text-gray-500 ml-2">{format(new Date(p.date), 'MMM d, yyyy')}</span>
                  {p.invoiceReference && <span className="text-xs text-gray-400 ml-2">Ref: {p.invoiceReference}</span>}
                </div>
                <span className="text-sm tabular text-emerald-600 font-semibold">+{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}