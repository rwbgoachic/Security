export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pos_transactions: {
        Row: {
          id: string
          amount: number
          description: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          amount: number
          description?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          amount?: number
          description?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
      }
      payroll_entries: {
        Row: {
          id: string
          employee_id: string
          amount: number
          type: string
          period_start: string
          period_end: string
          user_id: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          amount: number
          type: string
          period_start: string
          period_end: string
          user_id?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          type?: string
          period_start?: string
          period_end?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}