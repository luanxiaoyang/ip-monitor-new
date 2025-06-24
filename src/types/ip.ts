export interface IPRecord {
  id: string
  ip: string
  port: number
  username: string
  password: string
  name?: string
  notes?: string
  expiry_date: string
  is_active: boolean
  last_checked?: string
  status: 'online' | 'offline' | 'checking' | 'unknown'
  webhook_url?: string
  created_at: string
  updated_at: string
}

export interface IPFormData {
  ip: string
  port: number
  username: string
  password: string
  name?: string
  notes?: string
  expiry_date: string
  webhook_url?: string
}

export interface IPCheckResult {
  ip: string
  port: number
  status: 'online' | 'offline' | 'error'
  response_time?: number
  error?: string
}