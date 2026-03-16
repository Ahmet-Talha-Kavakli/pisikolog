import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://favcywikctxnpcyxuuaw.supabase.co';
const supabaseAnonKey = 'sb_publishable_HBH_dMXjFXwqoGwcKax8Lg_WkYJDqRo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LyraSession {
  id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  session_summary?: string;
  metadata?: Record<string, unknown>;
}

export interface LyraMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotions: Record<string, number>;
  created_at: string;
}

export interface LyraMemory {
  id: string;
  user_id?: string;
  content: string;
  embedding?: number[];
  emotional_context?: Record<string, number>;
  importance: number;
  created_at: string;
}

export async function searchMemories(embedding: number[], threshold = 0.5, count = 5) {
  const { data, error } = await supabase.rpc('match_lyra_memories', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count,
  });
  
  if (error) {
    console.error('Error searching memories:', error);
    return [];
  }
  
  return data;
}
