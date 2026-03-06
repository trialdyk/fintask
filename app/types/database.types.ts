export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      task_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category_id: number | null
          created_at: string
          deadline: string | null
          description: string | null
          difficulty: number | null
          effort: number | null
          id: number
          is_completed: boolean
          name: string
          priority: Database["public"]["Enums"]["task_priority"]
          tags: string[] | null
          user_id: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          difficulty?: number | null
          effort?: number | null
          id?: number
          is_completed?: boolean
          name: string
          priority?: Database["public"]["Enums"]["task_priority"]
          tags?: string[] | null
          user_id: string
        }
        Update: {
          category_id?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          difficulty?: number | null
          effort?: number | null
          id?: number
          is_completed?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: number
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      transaction_subcategories: {
        Row: {
          category_id: number
          created_at: string
          icon: string | null
          id: number
          name: string
          user_id: string
        }
        Insert: {
          category_id: number
          created_at?: string
          icon?: string | null
          id?: number
          name: string
          user_id: string
        }
        Update: {
          category_id?: number
          created_at?: string
          icon?: string | null
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string
          id: number
          linked_transaction_id: number | null
          notes: string | null
          subcategory_id: number | null
          tags: string[] | null
          timestamp: string
          title: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id: number
        }
        Insert: {
          amount?: number
          category_id?: number | null
          created_at?: string
          id?: number
          linked_transaction_id?: number | null
          notes?: string | null
          subcategory_id?: number | null
          tags?: string[] | null
          timestamp?: string
          title: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id: number
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string
          id?: number
          linked_transaction_id?: number | null
          notes?: string | null
          subcategory_id?: number | null
          tags?: string[] | null
          timestamp?: string
          title?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          wallet_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          color: string
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          icon: string
          id: number
          name: string
          type: Database["public"]["Enums"]["wallet_type"]
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          icon?: string
          id?: number
          name: string
          type?: Database["public"]["Enums"]["wallet_type"]
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          icon?: string
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["wallet_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency: "IDR" | "USD"
      task_priority: "low" | "medium" | "high"
      transaction_type: "income" | "expense" | "transfer" | "correction"
      wallet_type: "cash" | "bank" | "ewallet" | "credit_card"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Convenience Aliases ──────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// ─── Domain Aliases ───────────────────────────────────────────────────
export type Wallet = Tables<"wallets">
export type WalletInsert = TablesInsert<"wallets">
export type WalletUpdate = TablesUpdate<"wallets">

export type Transaction = Tables<"transactions">
export type TransactionInsert = TablesInsert<"transactions">

export type Task = Tables<"tasks">
export type TaskInsert = TablesInsert<"tasks">
export type TaskUpdate = TablesUpdate<"tasks">

export type TransactionCategory = Tables<"transaction_categories">
export type TransactionCategoryInsert = TablesInsert<"transaction_categories">

export type TransactionSubcategory = Tables<"transaction_subcategories">
export type TransactionSubcategoryInsert = TablesInsert<"transaction_subcategories">

export type TaskCategory = Tables<"task_categories">
export type TaskCategoryInsert = TablesInsert<"task_categories">

export type Currency = Enums<"currency">
export type TaskPriority = Enums<"task_priority">
export type TransactionType = Enums<"transaction_type">
export type WalletType = Enums<"wallet_type">
