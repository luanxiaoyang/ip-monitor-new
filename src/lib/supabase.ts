import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      ip_records: {
        Row: {
          id: string
          ip: string
          port: number
          username: string
          password: string
          name: string | null
          notes: string | null
          expiry_date: string
          is_active: boolean | null
          last_checked: string | null
          status: string | null
          webhook_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          ip: string
          port?: number
          username: string
          password: string
          name?: string | null
          notes?: string | null
          expiry_date: string
          is_active?: boolean | null
          last_checked?: string | null
          status?: string | null
          webhook_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          ip?: string
          port?: number
          username?: string
          password?: string
          name?: string | null
          notes?: string | null
          expiry_date?: string
          is_active?: boolean | null
          last_checked?: string | null
          status?: string | null
          webhook_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}