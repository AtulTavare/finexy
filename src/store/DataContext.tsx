import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  PulseData, PersonalIncome, PersonalExpense, PersonalDebt,
  Lead, Client, Engagement, BusinessPayment, BusinessExpense,
  Task, Project, Meeting,
} from '../types';
import { generateId, toCamelCase, toSnakeCase } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

interface Toast {
  id: number;
  message: string;
}

interface DataContextType extends PulseData {
  loading: boolean;
  toasts: Toast[];
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
  addBusinessPayment: (item: Omit<BusinessPayment, 'id' | 'createdAt' | 'engagementId'>) => void;
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

let toastId = 0;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<PulseData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const showToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  async function dbInsert(table: TableName, item: Record<string, any>): Promise<boolean> {
    const { error } = await supabase.from(table).insert({
      ...toSnakeCase(item),
      user_id: user!.id,
    });
    if (error) {
      console.error(`Supabase insert error (${table}):`, error);
      showToast(`Failed to save to ${table}: ${error.message}`);
      return false;
    }
    return true;
  }

  async function dbUpdate(table: TableName, id: string, updates: Record<string, any>): Promise<boolean> {
    const { error } = await supabase
      .from(table)
      .update(toSnakeCase(updates))
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) {
      console.error(`Supabase update error (${table}):`, error);
      showToast(`Failed to update: ${error.message}`);
      return false;
    }
    return true;
  }

  async function dbDelete(table: TableName, id: string): Promise<boolean> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) {
      console.error(`Supabase delete error (${table}):`, error);
      showToast(`Failed to delete: ${error.message}`);
      return false;
    }
    return true;
  }

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
        setDataLoaded(true);
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

  useEffect(() => {
    if (!user || !dataLoaded) return;

    const channel = supabase.channel('db-changes');

    for (const [key, table] of Object.entries(TABLE_MAP)) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        (payload) => {
          const k = key as keyof PulseData;
          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              const arr = prev[k] as any[];
              if (arr.some((item: any) => item.id === payload.new.id)) return prev;
              return { ...prev, [k]: [toCamelCase(payload.new) as any, ...arr] };
            });
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) => ({
              ...prev,
              [k]: (prev[k] as any[]).map((item: any) =>
                item.id === payload.new.id ? toCamelCase(payload.new) as any : item
              ),
            }));
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => ({
              ...prev,
              [k]: (prev[k] as any[]).filter((item: any) => item.id !== payload.old.id),
            }));
          }
        }
      );
    }

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, dataLoaded]);

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

  const addPersonalIncome = async (item: Omit<PersonalIncome, 'id' | 'createdAt'>) => {
    const newItem: PersonalIncome = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('personalIncome', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('personal_income', newItem);
    if (!ok) setArray('personalIncome', (prev) => prev.filter((i) => i.id !== newItem.id));
  };

  const updatePersonalIncome = async (id: string, updates: Partial<PersonalIncome>) => {
    const prev = data.personalIncome.find(i => i.id === id);
    setArray('personalIncome', (prevArr) => prevArr.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    const ok = await dbUpdate('personal_income', id, updates);
    if (!ok && prev) setArray('personalIncome', (prevArr) => prevArr.map((i) => (i.id === id ? prev : i)));
  };

  const deletePersonalIncome = async (id: string) => {
    const prev = data.personalIncome.find(i => i.id === id);
    setArray('personalIncome', (prevArr) => prevArr.filter((i) => i.id !== id));
    const ok = await dbDelete('personal_income', id);
    if (!ok && prev) setArray('personalIncome', (prevArr) => [prev, ...prevArr]);
  };

  const addPersonalExpense = async (item: Omit<PersonalExpense, 'id' | 'createdAt' | 'dayOfWeek'>) => {
    const dayOfWeek = format(new Date(item.date), 'EEEE');
    const newItem: PersonalExpense = { ...item, dayOfWeek, id: generateId(), createdAt: new Date().toISOString() };
    setArray('personalExpenses', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('personal_expenses', newItem);
    if (!ok) setArray('personalExpenses', (prev) => prev.filter((e) => e.id !== newItem.id));
  };

  const updatePersonalExpense = async (id: string, updates: Partial<PersonalExpense>) => {
    const prev = data.personalExpenses.find(e => e.id === id);
    setArray('personalExpenses', (prevArr) => prevArr.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const ok = await dbUpdate('personal_expenses', id, updates);
    if (!ok && prev) setArray('personalExpenses', (prevArr) => prevArr.map((e) => (e.id === id ? prev : e)));
  };

  const deletePersonalExpense = async (id: string) => {
    const prev = data.personalExpenses.find(e => e.id === id);
    setArray('personalExpenses', (prevArr) => prevArr.filter((e) => e.id !== id));
    const ok = await dbDelete('personal_expenses', id);
    if (!ok && prev) setArray('personalExpenses', (prevArr) => [prev, ...prevArr]);
  };

  const addPersonalDebt = async (item: Omit<PersonalDebt, 'id' | 'createdAt'>) => {
    const newItem: PersonalDebt = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('personalDebts', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('personal_debts', newItem);
    if (!ok) setArray('personalDebts', (prev) => prev.filter((d) => d.id !== newItem.id));
  };

  const updatePersonalDebt = async (id: string, updates: Partial<PersonalDebt>) => {
    const prev = data.personalDebts.find(d => d.id === id);
    setArray('personalDebts', (prevArr) => prevArr.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    const ok = await dbUpdate('personal_debts', id, updates);
    if (!ok && prev) setArray('personalDebts', (prevArr) => prevArr.map((d) => (d.id === id ? prev : d)));
  };

  const deletePersonalDebt = async (id: string) => {
    const prev = data.personalDebts.find(d => d.id === id);
    setArray('personalDebts', (prevArr) => prevArr.filter((d) => d.id !== id));
    const ok = await dbDelete('personal_debts', id);
    if (!ok && prev) setArray('personalDebts', (prevArr) => [prev, ...prevArr]);
  };

  const addLead = async (item: Omit<Lead, 'id' | 'createdAt'>) => {
    const newItem: Lead = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('leads', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('leads', newItem);
    if (!ok) setArray('leads', (prev) => prev.filter((l) => l.id !== newItem.id));
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const prev = data.leads.find(l => l.id === id);
    setArray('leads', (prevArr) =>
      prevArr.map((l) => {
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
          setData((prevData) => ({ ...prevData, clients: [newClient, ...prevData.clients] }));
        }
        return updated;
      })
    );
    const ok = await dbUpdate('leads', id, updates);
    if (!ok && prev) setArray('leads', (prevArr) => prevArr.map((l) => (l.id === id ? prev : l)));
  };

  const deleteLead = async (id: string) => {
    const prev = data.leads.find(l => l.id === id);
    setArray('leads', (prevArr) => prevArr.filter((l) => l.id !== id));
    const ok = await dbDelete('leads', id);
    if (!ok && prev) setArray('leads', (prevArr) => [prev, ...prevArr]);
  };

  const addClient = async (item: Omit<Client, 'id' | 'createdAt'>) => {
    const newItem: Client = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('clients', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('clients', newItem);
    if (!ok) setArray('clients', (prev) => prev.filter((c) => c.id !== newItem.id));
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const prev = data.clients.find(c => c.id === id);
    setArray('clients', (prevArr) => prevArr.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const ok = await dbUpdate('clients', id, updates);
    if (!ok && prev) setArray('clients', (prevArr) => prevArr.map((c) => (c.id === id ? prev : c)));
  };

  const deleteClient = async (id: string) => {
    const prev = data.clients.find(c => c.id === id);
    setArray('clients', (prevArr) => prevArr.filter((c) => c.id !== id));
    const ok = await dbDelete('clients', id);
    if (!ok && prev) setArray('clients', (prevArr) => [prev, ...prevArr]);
  };

  const addEngagement = async (item: Omit<Engagement, 'id' | 'createdAt'>) => {
    const newItem: Engagement = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('engagements', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('engagements', newItem);
    if (!ok) setArray('engagements', (prev) => prev.filter((e) => e.id !== newItem.id));
  };

  const updateEngagement = async (id: string, updates: Partial<Engagement>) => {
    const prev = data.engagements.find(e => e.id === id);
    setArray('engagements', (prevArr) => prevArr.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const ok = await dbUpdate('engagements', id, updates);
    if (!ok && prev) setArray('engagements', (prevArr) => prevArr.map((e) => (e.id === id ? prev : e)));
  };

  const deleteEngagement = async (id: string) => {
    const prev = data.engagements.find(e => e.id === id);
    setArray('engagements', (prevArr) => prevArr.filter((e) => e.id !== id));
    const ok = await dbDelete('engagements', id);
    if (!ok && prev) setArray('engagements', (prevArr) => [prev, ...prevArr]);
  };

  const addBusinessPayment = async (item: Omit<BusinessPayment, 'id' | 'createdAt' | 'engagementId'>) => {
    const activeEngagement = data.engagements.find(e => e.clientId === item.clientId && e.status === 'Active');
    const newItem: BusinessPayment = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
      engagementId: activeEngagement?.id || null,
    };
    setArray('businessPayments', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('business_payments', newItem);
    if (!ok) setArray('businessPayments', (prev) => prev.filter((p) => p.id !== newItem.id));
  };

  const updateBusinessPayment = async (id: string, updates: Partial<BusinessPayment>) => {
    const prev = data.businessPayments.find(p => p.id === id);
    setArray('businessPayments', (prevArr) => prevArr.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const ok = await dbUpdate('business_payments', id, updates);
    if (!ok && prev) setArray('businessPayments', (prevArr) => prevArr.map((p) => (p.id === id ? prev : p)));
  };

  const deleteBusinessPayment = async (id: string) => {
    const prev = data.businessPayments.find(p => p.id === id);
    setArray('businessPayments', (prevArr) => prevArr.filter((p) => p.id !== id));
    const ok = await dbDelete('business_payments', id);
    if (!ok && prev) setArray('businessPayments', (prevArr) => [prev, ...prevArr]);
  };

  const addBusinessExpense = async (item: Omit<BusinessExpense, 'id' | 'createdAt'>) => {
    const newItem: BusinessExpense = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('businessExpenses', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('business_expenses', newItem);
    if (!ok) setArray('businessExpenses', (prev) => prev.filter((e) => e.id !== newItem.id));
  };

  const updateBusinessExpense = async (id: string, updates: Partial<BusinessExpense>) => {
    const prev = data.businessExpenses.find(e => e.id === id);
    setArray('businessExpenses', (prevArr) => prevArr.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const ok = await dbUpdate('business_expenses', id, updates);
    if (!ok && prev) setArray('businessExpenses', (prevArr) => prevArr.map((e) => (e.id === id ? prev : e)));
  };

  const deleteBusinessExpense = async (id: string) => {
    const prev = data.businessExpenses.find(e => e.id === id);
    setArray('businessExpenses', (prevArr) => prevArr.filter((e) => e.id !== id));
    const ok = await dbDelete('business_expenses', id);
    if (!ok && prev) setArray('businessExpenses', (prevArr) => [prev, ...prevArr]);
  };

  const addTask = async (item: Omit<Task, 'id' | 'createdAt'>) => {
    const newItem: Task = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('tasks', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('tasks', newItem);
    if (!ok) setArray('tasks', (prev) => prev.filter((t) => t.id !== newItem.id));
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const prev = data.tasks.find(t => t.id === id);
    setArray('tasks', (prevArr) =>
      prevArr.map((t) => {
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
          setData((prevData) => ({ ...prevData, tasks: [...prevData.tasks, recurring] }));
        }
        return updated;
      })
    );
    const ok = await dbUpdate('tasks', id, updates);
    if (!ok && prev) setArray('tasks', (prevArr) => prevArr.map((t) => (t.id === id ? prev : t)));
  };

  const deleteTask = async (id: string) => {
    const prev = data.tasks.find(t => t.id === id);
    setArray('tasks', (prevArr) => prevArr.filter((t) => t.id !== id));
    const ok = await dbDelete('tasks', id);
    if (!ok && prev) setArray('tasks', (prevArr) => [prev, ...prevArr]);
  };

  const addProject = async (item: Omit<Project, 'id' | 'createdAt'>) => {
    const newItem: Project = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('projects', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('projects', newItem);
    if (!ok) setArray('projects', (prev) => prev.filter((p) => p.id !== newItem.id));
    if (ok && item.budget > 0) {
      const client = data.clients.find(c => c.id === item.clientId);
      const engagement: Engagement = {
        id: generateId(),
        clientId: item.clientId,
        brand: client?.brand || 'Infinity Innovations',
        type: 'Project',
        value: item.budget,
        paymentTerms: 'Milestones',
        startDate: format(new Date(item.startDate || new Date()), 'yyyy-MM-dd'),
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      setArray('engagements', (prev) => [engagement, ...prev]);
      await dbInsert('engagements', engagement);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const prev = data.projects.find(p => p.id === id);
    setArray('projects', (prevArr) => prevArr.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const ok = await dbUpdate('projects', id, updates);
    if (!ok && prev) setArray('projects', (prevArr) => prevArr.map((p) => (p.id === id ? prev : p)));
    if (ok && updates.budget !== undefined) {
      const activeEng = data.engagements.find(e => e.clientId === (prev?.clientId || id) && e.status === 'Active');
      if (activeEng) {
        const prevEng = data.engagements.find(e => e.id === activeEng.id);
        setArray('engagements', (prevArr) => prevArr.map((e) => (e.id === activeEng.id ? { ...e, value: updates.budget! } : e)));
        const engOk = await dbUpdate('engagements', activeEng.id, { value: updates.budget });
        if (!engOk && prevEng) setArray('engagements', (prevArr) => prevArr.map((e) => (e.id === activeEng.id ? prevEng : e)));
      } else if (updates.budget > 0) {
        const newEng: Engagement = {
          id: generateId(),
          clientId: prev?.clientId || id,
          brand: prev?.services?.[0] ? 'Infinity Innovations' : 'Infinity Innovations',
          type: 'Project',
          value: updates.budget,
          paymentTerms: 'Milestones',
          startDate: new Date().toISOString().slice(0, 10),
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        setArray('engagements', (prev) => [newEng, ...prev]);
        await dbInsert('engagements', newEng);
      }
    }
  };

  const deleteProject = async (id: string) => {
    const prev = data.projects.find(p => p.id === id);
    setArray('projects', (prevArr) => prevArr.filter((p) => p.id !== id));
    const ok = await dbDelete('projects', id);
    if (!ok && prev) setArray('projects', (prevArr) => [prev, ...prevArr]);
  };

  const addMeeting = async (item: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newItem: Meeting = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setArray('meetings', (prev) => [newItem, ...prev]);
    const ok = await dbInsert('meetings', newItem);
    if (!ok) setArray('meetings', (prev) => prev.filter((m) => m.id !== newItem.id));
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const prev = data.meetings.find(m => m.id === id);
    setArray('meetings', (prevArr) => prevArr.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    const ok = await dbUpdate('meetings', id, updates);
    if (!ok && prev) setArray('meetings', (prevArr) => prevArr.map((m) => (m.id === id ? prev : m)));
  };

  const deleteMeeting = async (id: string) => {
    const prev = data.meetings.find(m => m.id === id);
    setArray('meetings', (prevArr) => prevArr.filter((m) => m.id !== id));
    const ok = await dbDelete('meetings', id);
    if (!ok && prev) setArray('meetings', (prevArr) => [prev, ...prevArr]);
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        loading,
        toasts,
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
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2 max-w-sm">
          {toasts.map(t => (
            <div key={t.id} className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm animate-slide-up">
              {t.message}
            </div>
          ))}
        </div>
      )}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
