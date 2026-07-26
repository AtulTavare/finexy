import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, BusinessPayment, Document, Meeting } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toCamelCase, toSnakeCase, generateId } from '../lib/utils';

function extractStoragePath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/sign\/client-documents\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

interface ClientInfo {
  id: string;
  clientId: string;
  userName: string;
  email: string;
}

interface ClientDataContextType {
  client: ClientInfo | null;
  projects: Project[];
  businessPayments: BusinessPayment[];
  documents: Document[];
  meetings: Meeting[];
  loading: boolean;
  addDocument: (item: Omit<Document, 'id' | 'createdAt'>) => void;
  deleteDocument: (id: string) => void;
}

const empty: ClientDataContextType = {
  client: null,
  projects: [],
  businessPayments: [],
  documents: [],
  meetings: [],
  loading: true,
  addDocument: () => {},
  deleteDocument: () => {},
};

const ClientDataContext = createContext<ClientDataContextType>(empty);

export function ClientDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessPayments, setBusinessPayments] = useState<BusinessPayment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
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
          .select('id, client_id, user_name, email')
          .eq('user_id', user.id)
          .single();

        if (!cu) {
          setLoading(false);
          return;
        }

        const clientInfo: ClientInfo = {
          id: cu.id,
          clientId: cu.client_id,
          userName: cu.user_name,
          email: cu.email,
        };
        setClient(clientInfo);

        const [projRes, payRes, docRes, meetRes] = await Promise.all([
          supabase.from('projects').select('*').eq('client_id', cu.client_id).order('created_at', { ascending: false }),
          supabase.from('business_payments').select('*').eq('client_id', cu.client_id).order('date', { ascending: false }),
          supabase.from('client_documents').select('*').eq('client_id', cu.client_id).order('created_at', { ascending: false }),
          supabase.from('meetings').select('*').eq('client_id', cu.client_id).order('date', { ascending: false }),
        ]);

        setProjects((projRes.data || []).map(r => toCamelCase(r)) as any);
        setBusinessPayments((payRes.data || []).map(r => toCamelCase(r)) as any);
        setDocuments((docRes.data || []).map(r => toCamelCase(r)) as any);
        setMeetings((meetRes.data || []).map(r => toCamelCase(r)) as any);
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
      ...(toSnakeCase(newItem as any) as any),
      user_id: user!.id,
    });
    if (error) {
      console.error('Failed to upload document', error);
      setDocuments(prev => prev.filter(d => d.id !== newItem.id));
    }
  };

  const deleteDocument = async (id: string) => {
    const prev = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    const { error } = await supabase.from('client_documents').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete document:', error);
      if (prev) setDocuments(prevList => [prev, ...prevList]);
      return;
    }
    if (prev?.fileUrl) {
      const path = extractStoragePath(prev.fileUrl);
      if (path) await supabase.storage.from('client-documents').remove([path]);
    }
  };

  return (
    <ClientDataContext.Provider value={{ client, projects, businessPayments, documents, meetings, loading, addDocument, deleteDocument }}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  return useContext(ClientDataContext);
}
