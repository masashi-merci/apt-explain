
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Client, LogEntry, User, Agent } from '../types';

// --- Local Storage Fallback Logic ---
const LS_KEYS = {
  CLIENTS: 'mills_local_clients',
  AGENTS: 'mills_local_agents',
  LOGS: 'mills_local_logs'
};

const getLS = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLS = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Seed for Milztech Admin
const SUPER_ADMIN_CREDENTIALS = {
  username: 'milztech',
  password: 'admin' 
};

// --- Authentication ---

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  if (username === SUPER_ADMIN_CREDENTIALS.username && password === SUPER_ADMIN_CREDENTIALS.password) {
    return {
      id: 'super-admin',
      username: 'milztech',
      name: 'Milztech Admin',
      role: 'SUPER_ADMIN'
    };
  }

  if (!isSupabaseConfigured) {
    // Check Local Storage
    const clients = getLS<Client>(LS_KEYS.CLIENTS);
    const client = clients.find(c => c.username === username && c.password === password);
    if (client) {
      return { id: client.id, username: client.username, name: client.name, role: 'CLIENT_ADMIN', clientId: client.id };
    }

    const agents = getLS<Agent & {password: string, client_id: string}>(LS_KEYS.AGENTS);
    const agent = agents.find(a => a.username === username && a.password === password);
    if (agent) {
      return { id: agent.id, username: agent.username, name: agent.name, role: 'AGENT', clientId: agent.client_id };
    }
    return null;
  }

  try {
    const { data: clientData } = await supabase.from('clients').select('*').eq('username', username).eq('password', password).maybeSingle();
    if (clientData) return { id: clientData.id, username: clientData.username, name: clientData.name, role: 'CLIENT_ADMIN', clientId: clientData.id };

    const { data: agentData } = await supabase.from('agents').select('*').eq('username', username).eq('password', password).maybeSingle();
    if (agentData) return { id: agentData.id, username: agentData.username, name: agentData.name, role: 'AGENT', clientId: agentData.client_id };
  } catch (err) {
    console.error("Auth Exception:", err);
  }
  return null;
};

// --- Client Management ---

export const getAllClients = async (): Promise<Client[]> => {
  if (!isSupabaseConfigured) {
    const clients = getLS<Client>(LS_KEYS.CLIENTS);
    const agents = getLS<Agent>(LS_KEYS.AGENTS);
    return clients.map(c => ({ ...c, agents: agents.filter(a => a.client_id === c.id) }));
  }
  const { data } = await supabase.from('clients').select('*, agents(*)');
  return data || [];
};

export const addClient = async (name: string, username: string, password: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const clients = getLS<Client>(LS_KEYS.CLIENTS);
    if (clients.some(c => c.username === username)) throw new Error('ユーザーIDが重複しています');
    clients.push({ id: crypto.randomUUID(), name, username, password, created_at: new Date().toISOString() });
    saveLS(LS_KEYS.CLIENTS, clients);
    return;
  }
  await supabase.from('clients').insert([{ name, username, password }]);
};

export const deleteClient = async (clientId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const clients = getLS<Client>(LS_KEYS.CLIENTS).filter(c => c.id !== clientId);
    saveLS(LS_KEYS.CLIENTS, clients);
    return;
  }
  await supabase.from('clients').delete().eq('id', clientId);
};

// --- Agent Management ---

export const getClientAgents = async (clientId: string): Promise<Agent[]> => {
  if (!isSupabaseConfigured) {
    return getLS<Agent>(LS_KEYS.AGENTS).filter(a => a.client_id === clientId);
  }
  const { data } = await supabase.from('agents').select('*').eq('client_id', clientId);
  return data || [];
};

export const addAgent = async (clientId: string, name: string, username: string, password: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const agents = getLS<any>(LS_KEYS.AGENTS);
    agents.push({ id: crypto.randomUUID(), client_id: clientId, name, username, password });
    saveLS(LS_KEYS.AGENTS, agents);
    return;
  }
  await supabase.from('agents').insert([{ client_id: clientId, name, username, password }]);
};

export const deleteAgent = async (agentId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const agents = getLS<Agent>(LS_KEYS.AGENTS).filter(a => a.id !== agentId);
    saveLS(LS_KEYS.AGENTS, agents);
    return;
  }
  await supabase.from('agents').delete().eq('id', agentId);
};

// --- Logs ---

export const addLog = async (entry: Partial<LogEntry>): Promise<void> => {
  if (!isSupabaseConfigured) {
    const logs = getLS<LogEntry>(LS_KEYS.LOGS);
    const newLog = { 
      ...entry, 
      id: crypto.randomUUID(), 
      timestamp: new Date().toISOString() 
    } as LogEntry;
    logs.unshift(newLog);
    saveLS(LS_KEYS.LOGS, logs.slice(0, 100)); // 最大100件
    return;
  }
  
  const { error } = await supabase.from('logs').insert([{ 
    ...entry, 
    timestamp: new Date().toISOString() 
  }]);
  
  if (error) {
    console.error("Error adding log:", error);
    // Fallback to local storage if DB fails
    const logs = getLS<LogEntry>(LS_KEYS.LOGS);
    logs.unshift({ ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() } as LogEntry);
    saveLS(LS_KEYS.LOGS, logs.slice(0, 100));
  }
};

export const getLogsByClient = async (clientId: string): Promise<LogEntry[]> => {
  const localLogs = getLS<LogEntry>(LS_KEYS.LOGS).filter(l => l.client_id === clientId);
  
  if (!isSupabaseConfigured) {
    return localLogs;
  }
  
  const { data } = await supabase.from('logs').select('*').eq('client_id', clientId).order('timestamp', { ascending: false });
  const dbLogs = data || [];
  
  // Merge and sort by timestamp
  return [...dbLogs, ...localLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const getAllLogs = async (): Promise<LogEntry[]> => {
  const localLogs = getLS<LogEntry>(LS_KEYS.LOGS);
  
  if (!isSupabaseConfigured) {
    return localLogs;
  }
  
  const { data } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
  const dbLogs = data || [];
  
  // Merge and sort by timestamp
  return [...dbLogs, ...localLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
