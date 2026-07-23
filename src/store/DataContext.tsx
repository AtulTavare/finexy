import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  PulseData, PersonalIncome, PersonalExpense, PersonalDebt,
  Lead, Client, Engagement, BusinessPayment, BusinessExpense,
  Task, Project, Meeting,
} from '../types';
import { generateId, toCamelCase, toSnakeCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

interface DataContextType extends PulseData {
  loading: boolean;
  addPersonalIncome: (item: Omit<PersonalIncome, 'id' | 'createdAt'>) => void;
  updatePersonalIncome: (id: string, updates: Partial<PersonalIncome>) => void;
  deletePersonalIncome: (id: string) => void;
  addPersonalExpense: (item: Omit<PersonalExpense, 'id' | 'createdAt' | 'dayOfWeek'>) => void;
  updatePersonalExpense: (id: string, updates: Partial<PersonalExpense>) => void;
  deletePersonalExpense: (id: string) => void;
  addPersonalDebt: (item: Omit<PersonalDebt, 'id' | 'createdAt'>) => void;
  updatePersonalDebt: (id: string, updates: Partial<PersonalDebt>) => void;
  deletePersonalDebt: (id: string) => void;
  addLead: (item: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addClient: (item: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addEngagement: (item: Omit<Engagement, 'id' | 'createdAt'>) => void;
  updateEngagement: (id: string, updates: Partial<Engagement>) => void;
  deleteEngagement: (id: string) => void;
  addBusinessPayment: (item: Omit<BusinessPayment, 'id' | 'createdAt'>) => void;
  updateBusinessPayment: (id: string, updates: Partial<BusinessPayment>) => void;
  deleteBusinessPayment: (id: string) => void;
  addBusinessExpense: (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => void;
  updateBusinessExpense: (id: string, updates: Partial<BusinessExpense>) => void;
  deleteBusinessExpense: (id: string) => void;
  addTask: (item: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (item: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addMeeting: (item: Omit<Meeting, 'id' | 'createdAt'>) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
}

const emptyData: PulseData = {
  personalIncome: [],
  personalExpenses: [],
  personalDebts: [],
  leads: [],
  clients: [],
  engagements: [],
  businessPayments: [],
  businessExpenses: [],
  tasks: [],
  projects: [],
  meetings: [],
};

const DataContext = createContext<DataContextType | null>(null);

type TableName =
  | 'personal_income' | 'personal_expenses' | 'personal_debts'
  | 'leads' | 'clients' | 'engagements' | 'business_payments'
  | 'business_expenses' | 'tasks' | 'projects' | 'meetings';

const TABLE_MAP: Record<keyof PulseData, TableName> = {
  personalIncome: 'personal_income',
  personalExpenses: 'personal_expenses',
  personalDebts: 'personal_debts',
  leads: 'leads',
  clients: 'clients',
  engagements: 'engagements',
  businessPayments: 'business_payments',
  businessExpenses: 'business_expenses',
  tasks: 'tasks',
  projects: 'projects',
  meetings: 'meetings',
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<PulseData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem('pulse_data');

    (async () => {
      try {
        if (stored) {
          const parsed = JSON.parse(stored) as PulseData;
          const hasData = Object.values(parsed).some((arr) => arr.length > 0);
          if (hasData) {
            const { count } = await supabase
              .from('personal_income')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);

            if (count === 0) {
              await migrateData(parsed, user.id);
            }
          }
          localStorage.removeItem('pulse_data');
        }

        const loaded = await loadAllData(user.id);
        setData(loaded);
      } catch (e) {
        console.error('Failed to load data from Supabase', e);
        if (stored) {
          try { setData(JSON.parse(stored)); } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function migrateData(localData: PulseData, userId: string) {
    const now = new Date().toISOString();
    for (const [key, items] of Object.entries(localData)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      const table = TABLE_MAP[key as keyof PulseData];
      const rows = items.map((item: any) => ({
        ...toSnakeCase(item),
        user_id: userId,
        created_at: item.createdAt || now,
      }));
      const { error } = await supabase.from(table).insert(rows);
      if (error) console.error(`Migration error on ${table}:`, error);
    }
  }

  async function loadAllData(userId: string): Promise<PulseData> {
    const entries = Object.entries(TABLE_MAP) as [keyof PulseData, TableName][];
    const results = await Promise.all(
      entries.map(async ([key, table]) => {
        const { data: rows } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return [key, (rows || []).map((r: any) => toCamelCase(r))] as const;
      })
    );
    return Object.fromEntries(results) as unknown as PulseData;
  }

  function setArray<K extends keyof PulseData>(
    key: K,
    updater: (prev: PulseData[K]) => PulseData[K]
  ) {
    setData((prev) => ({ ...prev, [key]: updater(prev[key]) }));
  }

  async function dbInsert(table: TableName, item: Record<string, any>) {
    const { error } = await supabase.from(table).insert({
      ...toSnakeCase(item),
      user_id: user!.id,
    });
    if (error) console.error(`Supabase insert error (${table}):`, error);
  }

  async function dbUpdate(table: TableName, id: string, updates: Record<string, any>) {
    const { error } = await supabase
      .from(table)
      .update(toSnakeCase(updates))
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) console.error(`Supabase update error (${table}):`, error);
  }

  async function dbDelete(table: TableName, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) console.error(`Supabase delete error (${table}):`, error);
  }

  const addPersonalIncome = (item: Omit<PersonalIncome, 'id' | 'createdAt'>) => {
    const newItem: PersonalIncome = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('personal_income', newItem);
    setArray('personalIncome', (prev) => [newItem, ...prev]);
  };

  const updatePersonalIncome = (id: string, updates: Partial<PersonalIncome>) => {
    dbUpdate('personal_income', id, updates);
    setArray('personalIncome', (prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const deletePersonalIncome = (id: string) => {
    dbDelete('personal_income', id);
    setArray('personalIncome', (prev) => prev.filter((i) => i.id !== id));
  };

  const addPersonalExpense = (item: Omit<PersonalExpense, 'id' | 'createdAt' | 'dayOfWeek'>) => {
    const dayOfWeek = format(new Date(item.date), 'EEEE');
    const newItem: PersonalExpense = { ...item, dayOfWeek, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('personal_expenses', newItem);
    setArray('personalExpenses', (prev) => [newItem, ...prev]);
  };

  const updatePersonalExpense = (id: string, updates: Partial<PersonalExpense>) => {
    dbUpdate('personal_expenses', id, updates);
    setArray('personalExpenses', (prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deletePersonalExpense = (id: string) => {
    dbDelete('personal_expenses', id);
    setArray('personalExpenses', (prev) => prev.filter((e) => e.id !== id));
  };

  const addPersonalDebt = (item: Omit<PersonalDebt, 'id' | 'createdAt'>) => {
    const newItem: PersonalDebt = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('personal_debts', newItem);
    setArray('personalDebts', (prev) => [newItem, ...prev]);
  };

  const updatePersonalDebt = (id: string, updates: Partial<PersonalDebt>) => {
    dbUpdate('personal_debts', id, updates);
    setArray('personalDebts', (prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deletePersonalDebt = (id: string) => {
    dbDelete('personal_debts', id);
    setArray('personalDebts', (prev) => prev.filter((d) => d.id !== id));
  };

  const addLead = (item: Omit<Lead, 'id' | 'createdAt'>) => {
    const newItem: Lead = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('leads', newItem);
    setArray('leads', (prev) => [newItem, ...prev]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    dbUpdate('leads', id, updates);
    setArray('leads', (prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        if (updates.stage === 'Won' && l.stage !== 'Won') {
          const newClient: Client = {
            id: generateId(),
            leadId: l.id,
            name: l.name,
            brand: l.brand,
            contact: l.source,
            services: [],
            status: 'Active',
            createdAt: new Date().toISOString(),
          };
          dbInsert('clients', newClient);
          setData((prev) => ({ ...prev, clients: [newClient, ...prev.clients] }));
        }
        return updated;
      })
    );
  };

  const deleteLead = (id: string) => {
    dbDelete('leads', id);
    setArray('leads', (prev) => prev.filter((l) => l.id !== id));
  };

  const addClient = (item: Omit<Client, 'id' | 'createdAt'>) => {
    const newItem: Client = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('clients', newItem);
    setArray('clients', (prev) => [newItem, ...prev]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    dbUpdate('clients', id, updates);
    setArray('clients', (prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteClient = (id: string) => {
    dbDelete('clients', id);
    setArray('clients', (prev) => prev.filter((c) => c.id !== id));
  };

  const addEngagement = (item: Omit<Engagement, 'id' | 'createdAt'>) => {
    const newItem: Engagement = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('engagements', newItem);
    setArray('engagements', (prev) => [newItem, ...prev]);
  };

  const updateEngagement = (id: string, updates: Partial<Engagement>) => {
    dbUpdate('engagements', id, updates);
    setArray('engagements', (prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEngagement = (id: string) => {
    dbDelete('engagements', id);
    setArray('engagements', (prev) => prev.filter((e) => e.id !== id));
  };

  const addBusinessPayment = (item: Omit<BusinessPayment, 'id' | 'createdAt'>) => {
    const newItem: BusinessPayment = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
      engagementId: item.engagementId || '',
    };
    dbInsert('business_payments', newItem);
    setArray('businessPayments', (prev) => [newItem, ...prev]);
  };

  const updateBusinessPayment = (id: string, updates: Partial<BusinessPayment>) => {
    dbUpdate('business_payments', id, updates);
    setArray('businessPayments', (prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteBusinessPayment = (id: string) => {
    dbDelete('business_payments', id);
    setArray('businessPayments', (prev) => prev.filter((p) => p.id !== id));
  };

  const addBusinessExpense = (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => {
    const newItem: BusinessExpense = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('business_expenses', newItem);
    setArray('businessExpenses', (prev) => [newItem, ...prev]);
  };

  const updateBusinessExpense = (id: string, updates: Partial<BusinessExpense>) => {
    dbUpdate('business_expenses', id, updates);
    setArray('businessExpenses', (prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteBusinessExpense = (id: string) => {
    dbDelete('business_expenses', id);
    setArray('businessExpenses', (prev) => prev.filter((e) => e.id !== id));
  };

  const addTask = (item: Omit<Task, 'id' | 'createdAt'>) => {
    const newItem: Task = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('tasks', newItem);
    setArray('tasks', (prev) => [newItem, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dbUpdate('tasks', id, updates);
    setArray('tasks', (prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.isCompleted && !t.isCompleted && t.recurrence !== 'None') {
          const nextDate = new Date(t.dueDate);
          if (t.recurrence === 'Daily') nextDate.setDate(nextDate.getDate() + 1);
          if (t.recurrence === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
          if (t.recurrence === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          const recurring: Task = {
            ...t,
            id: generateId(),
            dueDate: format(nextDate, 'yyyy-MM-dd'),
            isCompleted: false,
            createdAt: new Date().toISOString(),
          };
          dbInsert('tasks', recurring);
          setData((prev) => ({ ...prev, tasks: [...prev.tasks, recurring] }));
        }
        return updated;
      })
    );
  };

  const deleteTask = (id: string) => {
    dbDelete('tasks', id);
    setArray('tasks', (prev) => prev.filter((t) => t.id !== id));
  };

  const addProject = (item: Omit<Project, 'id' | 'createdAt'>) => {
    const newItem: Project = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('projects', newItem);
    setArray('projects', (prev) => [newItem, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    dbUpdate('projects', id, updates);
    setArray('projects', (prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = (id: string) => {
    dbDelete('projects', id);
    setArray('projects', (prev) => prev.filter((p) => p.id !== id));
  };

  const addMeeting = (item: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newItem: Meeting = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    dbInsert('meetings', newItem);
    setArray('meetings', (prev) => [newItem, ...prev]);
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    dbUpdate('meetings', id, updates);
    setArray('meetings', (prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMeeting = (id: string) => {
    dbDelete('meetings', id);
    setArray('meetings', (prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        loading,
        addPersonalIncome, updatePersonalIncome, deletePersonalIncome,
        addPersonalExpense, updatePersonalExpense, deletePersonalExpense,
        addPersonalDebt, updatePersonalDebt, deletePersonalDebt,
        addLead, updateLead, deleteLead,
        addClient, updateClient, deleteClient,
        addEngagement, updateEngagement, deleteEngagement,
        addBusinessPayment, updateBusinessPayment, deleteBusinessPayment,
        addBusinessExpense, updateBusinessExpense, deleteBusinessExpense,
        addTask, updateTask, deleteTask,
        addProject, updateProject, deleteProject,
        addMeeting, updateMeeting, deleteMeeting,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
