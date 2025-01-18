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
      conversations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          messages: Json[]
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          messages: Json[]
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          messages?: Json[]
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          settings?: Json
        }
      }
    }
  }
}
