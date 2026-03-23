
import { createClient } from '@supabase/supabase-js';

// 提供されたプロジェクト情報をデフォルト設定
const DEFAULT_URL = 'https://xmtvogvhcvaeozgebjxx.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdHZvZ3ZoY3ZhZW96Z2Vianh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjkzODUsImV4cCI6MjA4MDMwNTM4NX0.Tdo8GINengPpqr6R-rROY7omSAd_bQs9gyNQi1X8Oew';

const getEnvVar = (key: string): string | undefined => {
  const keysToTry = [
    key,                                  // VITE_SUPABASE_URL
    key.replace('VITE_', ''),             // SUPABASE_URL
    `REACT_APP_${key.replace('VITE_', '')}` // REACT_APP_SUPABASE_URL
  ];

  if (typeof process !== 'undefined' && process.env) {
    for (const k of keysToTry) {
      if (process.env[k]) return process.env[k];
    }
  }
  
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      for (const k of keysToTry) {
        if (metaEnv[k]) return metaEnv[k];
      }
    }
  } catch (e) {}

  const win = window as any;
  for (const k of keysToTry) {
    if (win[k]) return win[k];
  }
  
  return undefined;
};

const finalUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_URL;
const finalKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

export const isSupabaseConfigured = !!(finalUrl && finalKey && !finalUrl.includes('placeholder'));

if (isSupabaseConfigured) {
  console.log('EstateCopy AI: クラウドモードで起動しました。');
} else {
  console.info('EstateCopy AI: Supabase未設定。ローカルモードで動作します。');
}

export const supabase = createClient(finalUrl, finalKey);
