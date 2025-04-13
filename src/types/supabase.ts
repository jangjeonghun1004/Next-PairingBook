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
      discussions: {
        Row: {
          id: number
          created_at: string
          title: string
          content: string
          book: {
            title: string
            author: string
          }
          topics: string[]
          tags: string[]
          image_urls: string[]
          scheduled_date: string
          max_participants: number
          privacy: string
          author_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          content: string
          book: {
            title: string
            author: string
          }
          topics: string[]
          tags: string[]
          image_urls?: string[]
          scheduled_date: string
          max_participants: number
          privacy: string
          author_id: string
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          content?: string
          book?: {
            title: string
            author: string
          }
          topics?: string[]
          tags?: string[]
          image_urls?: string[]
          scheduled_date?: string
          max_participants?: number
          privacy?: string
          author_id?: string
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
