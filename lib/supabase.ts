import { createClient } from "@supabase/supabase-js";

// Read Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey)
);

// Client for public reads (using anon key)
export const supabasePublic = isSupabaseConfigured && supabaseAnonKey
  ? createClient(supabaseUrl!, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

// Server-side client with elevated permissions for admin operations (never exposed to client)
export const supabaseAdmin = isSupabaseConfigured && (supabaseServiceRoleKey || supabaseAnonKey)
  ? createClient(supabaseUrl!, supabaseServiceRoleKey || supabaseAnonKey!, {
      auth: { persistSession: false },
    })
  : null;

export interface BeatRecord {
  id: string;
  title: string;
  producer?: string;
  bpm: number;
  key?: string;
  genre: string;
  moodTags: string[];
  price: number;
  coverUrl: string;
  audioUrl: string;
  buyLink?: string;
  description?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
