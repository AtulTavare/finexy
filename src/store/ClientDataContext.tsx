import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, BusinessPayment, Document } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toCamelCase, toSnakeCase, generateId } from '../lib/utils';

interface ClientInfo {
  id: string;
  clientId: string;
  name: string;
  mail: string;
}

interface ClientDataContextType {
  client: ClientInfo | null;
  projects: Project[];
  businessPayments: BusinessPayment[];
  documents: Document[];
  loading: boolean;
  addDocument: (item: Omit<Document, 'id' | 'createdAt'>) => void;
}

const empty: ClientDataContextType = {
  client: null,
  projects: [],
  businessPayments: [],
  documents: [],
  loading: true,
  addDocument: () => {},
};

const ClientDataContext = createContext<ClientDataContextType>(empty);

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessPayments, setBusinessPayments] = useState<BusinessPayment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data: cu } = await supabase
          .from('client_users')
          .select('id, client_id, name, mail')
          .eq('user_id', user.id)
          .single();

        if (!cu) {
          setLoading(false);
          return;
        }

        const clientInfo: ClientInfo = {
          id: cu.id,
          clientId: cu.client_id,
          name: cu.name,
          mail: cu.mail,
        };
        setClient(clientInfo);

        const [projRes, payRes, docRes] = await Promise.all([
          supabase.from('projects').select('*').eq('client_id', cu.client_id).order('created_at', { ascending: false }),
          supabase.from('business_payments').select('*').eq('client_id', cu.client_id).order('date', { ascending: false }),
          supabase.from('client_documents').select('*').eq('client_id', cu.client_id).order('created_at', { ascending: false }),
        ]);

        setProjects((projRes.data || []).map(r => toCamelCase(r)) as Project[]);
        setBusinessPayments((payRes.data || []).map(r => toCamelCase(r)) as BusinessPayment[]);
        setDocuments((docRes.data || []).map(r => toCamelCase(r)) as Document[]);
      } catch (e) {
        console.error('Failed to load client data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const addDocument = async (item: Omit<Document, 'id' | 'createdAt'>) => {
    const newItem: Document = { ...item, id: generateId(), createdAt: new Date().toISOString() };
    setDocuments(prev => [newItem, ...prev]);
    const { error } = await supabase.from('client_documents').insert({
      ...toSnakeCase(newItem),
      user_id: user!.id,
    });
    if (error) {
      console.error('Failed to upload document', error);
      setDocuments(prev => prev.filter(d => d.id !== newItem.id));
    }
  };

  return (
    <ClientDataContext.Provider value={{ client, projects, businessPayments, documents, loading, addDocument }}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  return useContext(ClientDataContext);
}
