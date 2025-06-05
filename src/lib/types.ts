import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  practice: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
} 