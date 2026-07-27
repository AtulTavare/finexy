import { useState, useEffect } from 'react';
import { Modal, Label, Input, Select, Button, Textarea, DatePicker } from './ui';
import { format } from 'date-fns';
import type { PersonalExpense, BusinessExpense } from '@/src/types';

type ExpenseType = 'personal' | 'business';

const PERSONAL_CATEGORIES = [
  'Food & Dining', 'Housing', 'Transportation', 'Entertainment',
  'Utilities', 'Healthcare', 'Shopping', 'Groceries',
  'Dining Out', 'Clothing', 'Electronics', 'Personal Care',
  'Gifts', 'Subscriptions', 'Insurance', 'Travel',
  'Education', 'Home Maintenance', 'Investments',
  'Other',
];

const BUSINESS_CATEGORIES = [
  'Tools', 'Ads', 'Contractor', 'Subscription',
  'Domain Purchase', 'SSL Certificate', 'Posting Subscription',
  'Office Supplies', 'Travel', 'Software', 'Hardware',
  'Marketing', 'Legal', 'Accounting', 'Insurance',
  'Rent', 'Salaries', 'Utilities', 'Hosting',
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
  const [category, setCategory] = useState(PERSONAL_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editPersonal) {
      setType('personal');
      setReason(editPersonal.reason);
      setAmount(editPersonal.amount.toString());
      setDate(new Date(editPersonal.date));
      setCategory(editPersonal.category);
      setPaymentMethod(editPersonal.paymentMethod);
      setDescription(editPersonal.description || '');
    } else if (editBusiness) {
      setType('business');
      setCategory(editBusiness.category);
      setAmount(editBusiness.amount.toString());
      setDate(new Date(editBusiness.date));
      setReason('');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDescription('');
    } else {
      setType(initialType);
      setCategory(initialType === 'personal' ? PERSONAL_CATEGORIES[0] : BUSINESS_CATEGORIES[0]);
      setAmount('');
      setDate(new Date());
      setReason('');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDescription('');
    }
  }, [editPersonal, editBusiness, isOpen, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const amt = parseFloat(amount);

    if (type === 'personal') {
      if (!reason || !onSavePersonal) return;
      if (editPersonal && onUpdatePersonal) {
        onUpdatePersonal(editPersonal.id, { reason, amount: amt, date: dateStr, category, paymentMethod, description: description || undefined });
      } else {
        onSavePersonal({ reason, amount: amt, date: dateStr, category, paymentMethod, description: description || undefined });
      }
    } else {
      if (editBusiness && onUpdateBusiness) {
        onUpdateBusiness(editBusiness.id, { brand: 'Infinity Innovations', category: category as BusinessExpense['category'], amount: amt, date: dateStr });
      } else if (onSaveBusiness) {
        onSaveBusiness({ brand: 'Infinity Innovations', category: category as BusinessExpense['category'], amount: amt, date: dateStr });
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
            onClick={() => { setType('personal'); setCategory(PERSONAL_CATEGORIES[0]); }}
          >
            Personal
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold uppercase cursor-pointer rounded-lg transition-all ${type === 'business' ? 'bg-[#18181b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => { setType('business'); setCategory(BUSINESS_CATEGORIES[0]); }}
          >
            Business
          </button>
        </div>

        {type === 'personal' && (
          <div>
            <Label>Reason</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Groceries" required />
          </div>
        )}

        <div>
          <Label>Category</Label>
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            {(type === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Amount</Label>
          <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>

        <div>
          <Label>Date</Label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {type === 'personal' && (
          <>
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
          </>
        )}

        <Button type="submit" className="w-full mt-4">
          {editPersonal || editBusiness ? 'Update Expense' : 'Save Expense'}
        </Button>
      </form>
    </Modal>
  );
}
