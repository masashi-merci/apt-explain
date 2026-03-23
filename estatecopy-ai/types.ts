
export type Role = 'SUPER_ADMIN' | 'CLIENT_ADMIN' | 'AGENT';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  clientId?: string; 
  avatar_url?: string;
}

export interface FormData {
  propertyName: string;
  address: string;
  propertyType: 'mansion' | 'house' | 'other';
  buildingAge?: string;
  totalUnits?: string;
  floorPlanText?: string;
  floorPlanImage?: File | null;
  pdfFile: File | null;
  referenceUrl: string;
  referenceText?: string;
  selectedAgentId: string;
}

export interface GenerationResult {
  text: string;
  characterCount: number;
  groundingUrls: string[];
  facilities?: Facility[];
  address?: string;
}

export interface Facility {
  name: string;
  distance?: string;
  category: 'スーパー' | '病院' | 'コンビニ' | '学校' | '郵便局' | '駅' | 'その他';
}

export interface ForbiddenTerm {
  category: string;
  words: string[];
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  client_id?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  username: string;
  password?: string;
  created_at?: string;
  agents?: Agent[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  client_id: string;
  agent_id: string;
  agent_name: string;
  property_name: string;
  address: string;
  result_text: string;
  grounding_urls: string[];
  search_used: boolean;
  pdf_url?: string;
  floor_plan_url?: string;
}

export type ViewState = 'login' | 'super_dashboard' | 'client_dashboard' | 'generator';
