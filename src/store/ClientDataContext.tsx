import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, BusinessPayment, Document, Meeting, Installment } from '../types';
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
  avatarUrl?: string;
  contact?: string;
  mail?: string;
  address?: string;
  businessName?: string;
  brand?: string;
  status?: string;
}

interface ClientDataContextType {
  client: ClientInfo | null;
  projects: Project[];
  businessPayments: BusinessPayment[];
  documents: Document[];
  meetings: Meeting[];
  installments: Installment[];
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
  installments: [],
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
  const [installments, setInstallments] = useState<Installment[]>([]);
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

        const { data: clientRec } = await supabase
          .from('clients')
          .select('avatar_url, contact, mail, address, business_name, brand, status')
          .eq('id', cu.client_id)
          .single();

        const clientInfo: ClientInfo = {
          id: cu.id,
          clientId: cu.client_id,
          userName: cu.user_name,
          email: cu.email,
          avatarUrl: (clientRec && 'avatar_url' in clientRec ? clientRec.avatar_url : undefined) as string | undefined,
          contact: (clientRec && 'contact' in clientRec ? clientRec.contact : undefined) as string | undefined,
          mail: (clientRec && 'mail' in clientRec ? clientRec.mail : undefined) as string | undefined,
          address: (clientRec && 'address' in clientRec ? clientRec.address : undefined) as string | undefined,
          businessName: (clientRec && 'business_name' in clientRec ? clientRec.business_name : undefined) as string | undefined,
          brand: (clientRec && 'brand' in clientRec ? clientRec.brand : undefined) as string | undefined,
          status: (clientRec && 'status' in clientRec ? clientRec.status : undefined) as string | undefined,
        };
        setClient(clientInfo);

        const q = async (table: string) => {
          try {
            const { data } = await supabase.from(table).select('*').eq('client_id', cu.client_id);
            return (data || []).map(r => toCamelCase(r));
          } catch { return []; }
        };

        const [projData, payData, docData, meetData] = await Promise.all([
          q('projects'), q('business_payments'), q('client_documents'), q('meetings'),
        ]);

        setProjects(projData as any);
        setBusinessPayments(payData as any);
        setDocuments(docData as any);
        setMeetings(meetData as any);
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
    <ClientDataContext.Provider value={{ client, projects, businessPayments, documents, meetings, installments, loading, addDocument, deleteDocument }}>
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  return useContext(ClientDataContext);
}
