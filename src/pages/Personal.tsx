import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../store/DataContext';
import { Card, Button, Input, Select, Label, Modal, Badge, DatePicker, Textarea, ConfirmDialog } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { PersonalExpense, PersonalDebt } from '../types';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function Personal() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'debts'>('expenses');
  const { 
    personalExpenses, addPersonalExpense, updatePersonalExpense, deletePersonalExpense,
    personalDebts, addPersonalDebt, deletePersonalDebt, updatePersonalDebt 
  } = useData();

  const sortedExpenses = [...personalExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedDebts = [...personalDebts].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Form Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [editingDebt, setEditingDebt] = useState<PersonalDebt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'expense' | 'debt' } | null>(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal) {
      const modal = location.state.openModal;
      if (modal === 'open-expense-modal') {
        setActiveTab('expenses');
        setShowExpenseModal(true);
      } else if (modal === 'open-debt-modal') {
        setActiveTab('debts');
        setShowDebtModal(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  React.useEffect(() => {
    const onExpense = () => { setActiveTab('expenses'); setShowExpenseModal(true); };
    const onDebt = () => { setActiveTab('debts'); setShowDebtModal(true); };
    window.addEventListener('open-expense-modal', onExpense);
    window.addEventListener('open-debt-modal', onDebt);
    return () => {
      window.removeEventListener('open-expense-modal', onExpense);
      window.removeEventListener('open-debt-modal', onDebt);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Personal Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal cash flow and obligations.</p>
        </div>
        <div className="flex w-full md:w-auto">
          {activeTab === 'expenses' && <Button className="w-full md:w-auto" onClick={() => setShowExpenseModal(true)}>+ Add Expense</Button>}
          {activeTab === 'debts' && <Button className="w-full md:w-auto" onClick={() => setShowDebtModal(true)}>+ Add Debt</Button>}
        </div>
      </div>

      <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 max-w-full md:max-w-fit mb-2 overflow-x-auto no-scrollbar shrink-0">
        {(['expenses', 'debts'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#18181b] text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <div className="p-6">
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {sortedExpenses.length === 0 ? (
                <div className="text-gray-900 text-sm italic">No expenses recorded yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                      <th className="pb-2 font-semibold hidden md:table-cell">Date</th>
                      <th className="pb-2 font-semibold">Reason</th>
                      <th className="pb-2 font-semibold hidden md:table-cell">Category</th>
                      <th className="pb-2 font-semibold text-right">Amount</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map(exp => (
                      <tr key={exp.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditingExpense(exp); setShowExpenseModal(true); }}>
                        <td className="py-2.5 md:py-3 hidden md:table-cell text-gray-900">{format(new Date(exp.date), 'MMM d, yyyy')}</td>
                        <td className="py-2.5 md:py-3">
                          <div className="font-medium">{exp.reason}</div>
                          {exp.description && <div className="text-[10px] text-gray-500 mt-0.5">{exp.description}</div>}
                          <div className="md:hidden text-[10px] text-gray-900 mt-1">{format(new Date(exp.date), 'MMM d')} &bull; {exp.category}</div>
                          <div className="hidden md:block text-[10px] text-gray-900 mt-1">via {exp.paymentMethod}</div>
                        </td>
                        <td className="py-2.5 md:py-3 hidden md:table-cell"><Badge>{exp.category}</Badge></td>
                        <td className="py-2.5 md:py-3 text-right tabular text-red-500 font-semibold">-{formatCurrency(exp.amount)}</td>
                        <td className="py-2.5 md:py-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: exp.id, name: exp.reason, type: 'expense' }); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'debts' && (
            <div className="space-y-4">
              {sortedDebts.length === 0 ? (
                <div className="text-gray-900 text-sm italic">No debts recorded yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                      <th className="pb-2 font-semibold hidden md:table-cell">Due Date</th>
                      <th className="pb-2 font-semibold">Party</th>
                      <th className="pb-2 font-semibold text-right">Amount</th>
                      <th className="pb-2 font-semibold text-center">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDebts.map(debt => (
                      <tr key={debt.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditingDebt(debt); setShowDebtModal(true); }}>
                        <td className="py-2.5 md:py-3 hidden md:table-cell text-gray-900">{format(new Date(debt.dueDate), 'MMM d, yyyy')}</td>
                        <td className="py-2.5 md:py-3">
                          <div className="font-medium">{debt.partyName}</div>
                          <div className="md:hidden text-[10px] text-gray-900 mt-1">Due {format(new Date(debt.dueDate), 'MMM d')}</div>
                          <div className="mt-1"><Badge variant={debt.type === 'I Owe' ? 'danger' : 'success'}>{debt.type}</Badge></div>
                        </td>
                        <td className="py-2.5 md:py-3 text-right tabular">{formatCurrency(debt.amount)}</td>
                        <td className="py-2.5 md:py-3 text-center">
                           <button 
                              onClick={(e) => { e.stopPropagation(); updatePersonalDebt(debt.id, { status: debt.status === 'Paid' ? 'Pending' : 'Paid' }); }}
                              className={`text-[10px] uppercase font-semibold tracking-widest cursor-pointer px-2 py-1 rounded-sm transition-colors ${debt.status === 'Paid' ? 'bg-green-300 text-gray-900' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                           >
                              {debt.status}
                           </button>
                        </td>
                        <td className="py-2.5 md:py-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: debt.id, name: debt.partyName, type: 'debt' }); }} className="text-gray-900 hover:text-red-500 p-1 cursor-pointer"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </Card>

      <ExpenseModal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }} onSave={addPersonalExpense} onUpdate={updatePersonalExpense} editItem={editingExpense} />
      <DebtModal isOpen={showDebtModal} onClose={() => { setShowDebtModal(false); setEditingDebt(null); }} onSave={addPersonalDebt} onUpdate={updatePersonalDebt} editItem={editingDebt} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'expense' ? 'Expense' : 'Debt'}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'expense') deletePersonalExpense(deleteTarget.id);
          else deletePersonalDebt(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// Sub-components for forms

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PersonalExpense, 'id' | 'createdAt' | 'dayOfWeek'>) => void;
  onUpdate?: (id: string, updates: Partial<PersonalExpense>) => void;
  editItem?: PersonalExpense | null;
}

function ExpenseModal({ isOpen, onClose, onSave, onUpdate, editItem }: ExpenseModalProps) {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editItem) {
      setReason(editItem.reason);
      setAmount(editItem.amount.toString());
      setDate(new Date(editItem.date));
      setCategory(editItem.category);
      setPaymentMethod(editItem.paymentMethod);
      setDescription(editItem.description || '');
    } else {
      setReason(''); setAmount(''); setDate(new Date()); setCategory('Food & Dining'); setPaymentMethod('Credit Card'); setDescription('');
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !amount || !date) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { reason, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), category, paymentMethod, description: description || undefined });
    } else {
      onSave({ reason, amount: parseFloat(amount), date: format(date, 'yyyy-MM-dd'), category, paymentMethod, description: description || undefined });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Groceries" required /></div>
        <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <div><Label>Date</Label><DatePicker value={date} onChange={setDate} /></div>
        <div>
          <Label>Category</Label>
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Housing">Housing</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Domain Purchase">Domain Purchase</option>
            <option value="SSL Certificate">SSL Certificate</option>
            <option value="Posting Subscription">Posting Subscription</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
          </Select>
        </div>
        <div><Label>Description (Optional)</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional notes..." /></div>
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Expense' : 'Save Expense'}</Button>
      </form>
    </Modal>
  );
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PersonalDebt, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, updates: Partial<PersonalDebt>) => void;
  editItem?: PersonalDebt | null;
}

function DebtModal({ isOpen, onClose, onSave, onUpdate, editItem }: DebtModalProps) {
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [type, setType] = useState<'I Owe' | 'Owed to Me'>('I Owe');

  useEffect(() => {
    if (editItem) {
      setPartyName(editItem.partyName);
      setAmount(editItem.amount.toString());
      setDueDate(new Date(editItem.dueDate));
      setType(editItem.type);
    } else {
      setPartyName(''); setAmount(''); setDueDate(new Date()); setType('I Owe');
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount || !dueDate) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { partyName, amount: parseFloat(amount), dueDate: format(dueDate, 'yyyy-MM-dd'), type });
    } else {
      onSave({ partyName, amount: parseFloat(amount), dueDate: format(dueDate, 'yyyy-MM-dd'), type, status: 'Pending' });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Edit Debt' : 'Add Debt'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button type="button" className={`flex-1 py-2 text-xs font-semibold uppercase cursor-pointer rounded-lg transition-all ${type === 'I Owe' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setType('I Owe')}>I Owe</button>
          <button type="button" className={`flex-1 py-2 text-xs font-semibold uppercase cursor-pointer rounded-lg transition-all ${type === 'Owed to Me' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setType('Owed to Me')}>Owed To Me</button>
        </div>
        <div><Label>Party Name</Label><Input value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="e.g. John Doe" required /></div>
        <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <div><Label>Due Date</Label><DatePicker value={dueDate} onChange={setDueDate} /></div>
        <Button type="submit" className="w-full mt-4">{editItem ? 'Update Debt' : 'Save Debt'}</Button>
      </form>
    </Modal>
  );
}
