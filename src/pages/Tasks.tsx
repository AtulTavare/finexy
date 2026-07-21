import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Select, Label, Modal, Badge, DatePicker } from '../components/ui';
import { Brand, Task } from '../types';
import { format, isToday, isThisWeek, isBefore, startOfToday } from 'date-fns';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

const BRANDS: Brand[] = ['Infinity Innovations'];

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<'Today' | 'This Week' | 'Overdue' | 'By Brand'>('Today');
  const { tasks, addTask, updateTask, deleteTask } = useData();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal === 'open-task-modal') {
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filter logic
  const today = startOfToday();
  const filteredTasks = tasks.filter(t => !t.isCompleted).filter(t => {
    const d = new Date(t.dueDate);
    if (activeTab === 'Today') return isToday(d) || isBefore(d, today);
    if (activeTab === 'This Week') return isThisWeek(d) || isBefore(d, today);
    if (activeTab === 'Overdue') return isBefore(d, today);
    return true; // For By Brand, we'll group them below
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  React.useEffect(() => {
    const onTask = () => setShowModal(true);
    window.addEventListener('open-task-modal', onTask);
    return () => window.removeEventListener('open-task-modal', onTask);
  }, []);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tasks & Duties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage operations and deliverables.</p>
        </div>
        <div className="flex w-full md:w-auto">
          <Button className="w-full md:w-auto" onClick={() => setShowModal(true)}>+ Add Task</Button>
        </div>
      </div>

      <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 max-w-full md:max-w-fit mb-2 overflow-x-auto no-scrollbar shrink-0">
        {(['Today', 'This Week', 'Overdue', 'By Brand'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#18181b] text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="p-0 bg-white">
        <div className="p-4 md:p-6 space-y-4">
          {activeTab !== 'By Brand' ? (
            sortedTasks.length === 0 ? (
              <div className="text-gray-900 text-sm italic">No tasks in this view.</div>
            ) : (
              sortedTasks.map(t => <TaskItem key={t.id} task={t} onToggle={() => updateTask(t.id, { isCompleted: !t.isCompleted })} onDelete={() => { deleteTask(t.id) }} />)
            )
          ) : (
            <div className="space-y-8">
              {BRANDS.map(brand => {
                const brandTasks = tasks.filter(t => !t.isCompleted && t.brand === brand).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                if (brandTasks.length === 0) return null;
                return (
                  <div key={brand}>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">{brand}</h3>
                    <div className="space-y-3">
                      {brandTasks.map(t => <TaskItem key={t.id} task={t} onToggle={() => updateTask(t.id, { isCompleted: !t.isCompleted })} onDelete={() => { deleteTask(t.id) }} />)}
                    </div>
                  </div>
                );
              })}
              {/* No Brand tasks */}
              {(() => {
                const nbTasks = tasks.filter(t => !t.isCompleted && !t.brand).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                if (nbTasks.length === 0) return null;
                return (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3">Personal / No Brand</h3>
                    <div className="space-y-3">
                      {nbTasks.map(t => <TaskItem key={t.id} task={t} onToggle={() => updateTask(t.id, { isCompleted: !t.isCompleted })} onDelete={() => { deleteTask(t.id) }} />)}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </Card>

      <TaskModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={addTask} />
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task, onToggle: () => void, onDelete: () => void, key?: React.Key }) {
  const isOverdue = isBefore(new Date(task.dueDate), startOfToday());
  
  return (
    <div className="flex items-start space-x-3 p-3 border border-gray-100 bg-white hover:border-orange-500 rounded-xl shadow-sm transition-colors group">
      <button onClick={onToggle} className="mt-0.5 text-gray-900 hover:text-gray-900 transition-colors cursor-pointer">
        {task.isCompleted ? <CheckCircle size={20} className="text-emerald-500" /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-900' : 'text-gray-900'}`}>{task.title}</h4>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />}
            {task.brand && <Badge className="inline-flex">{task.brand}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center mt-1 text-[10px] text-gray-900 uppercase gap-2">
          <span className={isOverdue && !task.isCompleted ? 'text-red-500 font-semibold font-semibold' : ''}>
            Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </span>
          <span>&bull;</span>
          <span>{task.type}</span>
          {task.recurrence !== 'None' && (
            <>
              <span>&bull;</span>
              <span>↻ {task.recurrence}</span>
            </>
          )}
        </div>
      </div>
      <button onClick={onDelete} className="text-gray-900 hover:text-red-500 p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TaskModal({ isOpen, onClose, onSave }: any) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Task['type']>('Personal');
  const [brand, setBrand] = useState<Brand | ''>('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState<Task['recurrence']>('None');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    onSave({
      title, type, priority, dueDate: format(dueDate, 'yyyy-MM-dd'), recurrence,
      brand: brand || undefined,
      isCompleted: false
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Task Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onChange={e => setType(e.target.value as any)}>
              <option value="Personal">Personal</option>
              <option value="Agency Duty">Agency Duty</option>
              <option value="Client Work">Client Work</option>
              <option value="Admin">Admin</option>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Brand (Optional)</Label>
          <Select value={brand} onChange={e => setBrand(e.target.value as any)}>
            <option value="">None / Personal</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Due Date</Label><DatePicker value={dueDate} onChange={setDueDate} /></div>
          <div>
            <Label>Recurrence</Label>
            <Select value={recurrence} onChange={e => setRecurrence(e.target.value as any)}>
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </Select>
          </div>
        </div>
        <Button type="submit" className="w-full mt-4">Save Task</Button>
      </form>
    </Modal>
  );
}

