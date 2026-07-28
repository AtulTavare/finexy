import { useState, useEffect } from 'react';
import { Modal, Label, Input, Select, Button, Textarea, DatePicker } from './ui';
import { format } from 'date-fns';
import type { PersonalExpense, BusinessExpense } from '@/src/types';

type ExpenseType = 'personal' | 'business';

const PERSONAL_CATEGORIES = [
  'Mobile', 'Room rent', 'Cigarette', 'Drinks',
  'Fuel', 'Food', 'Entertainment', 'Health care',
  'Shopping', 'Dine out', 'Clothing', 'Electronics',
  'Grooming', 'Gift', 'Trading', 'Other',
];

const BUSINESS_CATEGORIES = [
  'Cloud & Hosting', 'SaaS Subscriptions', 'Freelancers & Contractors',
  'Advertising & Promotion', 'Domain & SSL', 'Office Rent',
  'Salaries & Payroll', 'Legal & Accounting', 'Travel & Meetings',
  'Hardware & Equipment', 'Internet & Telecom', 'Training & Education',
  'Office Supplies', 'Software Licenses', 'Marketing & SEO',
  'Client Acquisition', 'AI API Costs', 'Design Tools',
  'Communication Tools', 'Insurance', 'Food & Team Meals',
  'Other',
];

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'UPI'];

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePersonal?: (item: Omit<PersonalExpense, 'id' | 'createdAt' | 'dayOfWeek'>) => void;
  onSaveBusiness?: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  onUpdatePersonal?: (id: string, updates: Partial<PersonalExpense>) => void;
  onUpdateBusiness?: (id: string, updates: Partial<BusinessExpense>) => void;
  editPersonal?: PersonalExpense | null;
  editBusiness?: BusinessExpense | null;
  initialType?: ExpenseType;
}

export function AddExpenseModal({
  isOpen, onClose,
  onSavePersonal, onSaveBusiness,
  onUpdatePersonal, onUpdateBusiness,
  editPersonal, editBusiness,
  initialType = 'personal',
}: AddExpenseModalProps) {
  const [type, setType] = useState<ExpenseType>(initialType);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateMode, setDateMode] = useState<'single' | 'period'>('single');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');

  const categories = type === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
  const isOther = category === 'Other';

  const resetForm = (t: ExpenseType, cat?: string, reasonVal?: string, amt?: string, dt?: Date, pm?: string, desc?: string, custom?: string, fromDt?: Date, toDt?: Date) => {
    setType(t);
    const cats = t === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
    if (cat && !cats.includes(cat)) {
      setCategory('Other');
      setCustomCategory(cat);
    } else {
      setCategory(cat ?? cats[0]);
      setCustomCategory(custom ?? '');
    }
    setReason(reasonVal ?? '');
    setAmount(amt ?? '');
    setDate(dt ?? new Date());
    setDateMode(fromDt || toDt ? 'period' : 'single');
    setFromDate(fromDt ?? dt ?? new Date());
    setToDate(toDt ?? dt ?? new Date());
    setPaymentMethod(pm ?? PAYMENT_METHODS[0]);
    setDescription(desc ?? '');
  };

  useEffect(() => {
    if (editPersonal) {
      resetForm('personal', editPersonal.category, editPersonal.reason, editPersonal.amount.toString(), new Date(editPersonal.date), editPersonal.paymentMethod, editPersonal.description || '', undefined, editPersonal.fromDate ? new Date(editPersonal.fromDate) : undefined, editPersonal.toDate ? new Date(editPersonal.toDate) : undefined);
    } else if (editBusiness) {
      resetForm('business', editBusiness.category, '', editBusiness.amount.toString(), new Date(editBusiness.date));
    } else {
      resetForm(initialType);
    }
  }, [editPersonal, editBusiness, isOpen, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const finalCategory = isOther ? customCategory.trim() || 'Other' : category;
    const amt = parseFloat(amount);

    const dateStr = dateMode === 'period' ? format(fromDate, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');

    if (type === 'personal') {
      if (!reason || !onSavePersonal) return;
      const fromDateStr = dateMode === 'period' ? format(fromDate, 'yyyy-MM-dd') : undefined;
      const toDateStr = dateMode === 'period' ? format(toDate, 'yyyy-MM-dd') : undefined;
      if (editPersonal && onUpdatePersonal) {
        onUpdatePersonal(editPersonal.id, { reason, amount: amt, date: dateStr, fromDate: fromDateStr, toDate: toDateStr, category: finalCategory, paymentMethod, description: description || undefined });
      } else {
        onSavePersonal({ reason, amount: amt, date: dateStr, fromDate: fromDateStr, toDate: toDateStr, category: finalCategory, paymentMethod, description: description || undefined });
      }
    } else {
      if (editBusiness && onUpdateBusiness) {
        onUpdateBusiness(editBusiness.id, { brand: 'Infinity Innovations', category: finalCategory as BusinessExpense['category'], amount: amt, date: dateStr });
      } else if (onSaveBusiness) {
        onSaveBusiness({ brand: 'Infinity Innovations', category: finalCategory as BusinessExpense['category'], amount: amt, date: dateStr });
      }
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editPersonal || editBusiness ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold uppercase cursor-pointer rounded-lg transition-all ${type === 'personal' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => { setType('personal'); setCategory(PERSONAL_CATEGORIES[0]); setCustomCategory(''); }}
          >
            Personal
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold uppercase cursor-pointer rounded-lg transition-all ${type === 'business' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => { setType('business'); setCategory(BUSINESS_CATEGORIES[0]); setCustomCategory(''); }}
          >
            Business
          </button>
        </div>

        <div>
          <Label>Reason / Title</Label>
          <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Monthly hosting bill" required />
        </div>

        <div>
          <Label>Category</Label>
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          {isOther && (
            <Input
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              placeholder="Type custom category..."
              className="mt-2"
            />
          )}
        </div>

        <div>
          <Label>Amount</Label>
          <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>

        <div>
          <Label>Date</Label>
          {type === 'personal' && (
            <div className="flex bg-gray-100 p-0.5 rounded-lg mb-2">
              <button type="button" className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${dateMode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setDateMode('single')}>One day</button>
              <button type="button" className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${dateMode === 'period' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setDateMode('period')}>Period</button>
            </div>
          )}
          {dateMode === 'single' ? (
            <DatePicker value={date} onChange={setDate} />
          ) : (
            <div className="flex gap-2">
              <div className="flex-1"><Label className="text-[10px]">From</Label><DatePicker value={fromDate} onChange={setFromDate} /></div>
              <div className="flex-1"><Label className="text-[10px]">To</Label><DatePicker value={toDate} onChange={setToDate} /></div>
            </div>
          )}
        </div>

        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>

        <div>
          <Label>Description (Optional)</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional notes..." />
        </div>

        <Button type="submit" className="w-full mt-4">
          {editPersonal || editBusiness ? 'Update Expense' : 'Save Expense'}
        </Button>
      </form>
    </Modal>
  );
}
