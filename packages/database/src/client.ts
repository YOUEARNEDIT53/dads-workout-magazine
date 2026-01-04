import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@dads-workout/shared';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const cfg = config();
    supabaseInstance = createClient(cfg.supabase.url, cfg.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// Database types
export interface Issue {
  id: string;
  issue_number: number;
  week_number: number;
  year: number;
  title: string;
  slug: string;
  editors_letter: string;
  gear_corner: GearCorner;
  challenge_update: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  email_sent_at: string | null;
  email_recipient_count: number;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GearCorner {
  productName: string;
  description: string;
  price: string;
  pros: string[];
  cons: string[];
}

export interface Article {
  id: string;
  issue_id: string;
  author_id: string;
  author_name: string;
  author_title: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  word_count: number;
  article_type: 'main_column' | 'wildcard' | 'guest';
  position: number;
  topics: string[];
  created_at: string;
}

export interface QuickWin {
  id: string;
  issue_id: string;
  title: string;
  content: string;
  category: 'workout' | 'nutrition' | 'mindset' | 'recovery' | 'lifestyle';
  position: number;
  created_at: string;
}

export interface ReaderQA {
  id: string;
  issue_id: string;
  question: string;
  answer: string;
  answering_expert: string | null;
  position: number;
  submitted_by: string | null;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscribed_at: string;
  unsubscribed_at: string | null;
  preferences: Record<string, unknown>;
}

export interface Topic {
  id: string;
  topic_name: string;
  category: string;
  last_used_at: string | null;
  usage_count: number;
  cooldown_weeks: number;
  created_at: string;
}

export interface MonthlyChallenge {
  id: string;
  title: string;
  description: string;
  month: number;
  year: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  weekly_milestones: WeeklyMilestone[];
  tips: string[];
  is_active: boolean;
  created_at: string;
}

export interface WeeklyMilestone {
  week: number;
  focus: string;
  goal: string;
}
