export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cameras: {
        Row: {
          camera_id: string | null
          created_at: string
          id: string
          location: string
          name: string
          status: Database["public"]["Enums"]["camera_status"]
          updated_at: string
        }
        Insert: {
          camera_id?: string | null
          created_at?: string
          id?: string
          location: string
          name: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Update: {
          camera_id?: string | null
          created_at?: string
          id?: string
          location?: string
          name?: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          id: string
          join_date: string
          name: string
          nid: string | null
          phone: string
          role: Database["public"]["Enums"]["employee_role"]
          salary: number
          shift: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_date?: string
          name: string
          nid?: string | null
          phone: string
          role: Database["public"]["Enums"]["employee_role"]
          salary: number
          shift?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          join_date?: string
          name?: string
          nid?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["employee_role"]
          salary?: number
          shift?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flats: {
        Row: {
          created_at: string
          flat_number: string
          floor: number
          id: string
          parking_spot: string | null
          size: number
          status: Database["public"]["Enums"]["flat_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          flat_number: string
          floor: number
          id?: string
          parking_spot?: string | null
          size?: number
          status?: Database["public"]["Enums"]["flat_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          flat_number?: string
          floor?: number
          id?: string
          parking_spot?: string | null
          size?: number
          status?: Database["public"]["Enums"]["flat_status"]
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          flat_id: string
          id: string
          month: string
          paid_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          flat_id: string
          id?: string
          month: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          flat_id?: string
          id?: string
          month?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          email: string | null
          emergency_contact: string | null
          flat_id: string | null
          id: string
          name: string
          nid: string | null
          ownership_start: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          flat_id?: string | null
          id?: string
          name: string
          nid?: string | null
          ownership_start?: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          flat_id?: string | null
          id?: string
          name?: string
          nid?: string | null
          ownership_start?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          flat_id: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          flat_id: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          flat_id?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["request_category"]
          cost: number | null
          created_at: string
          description: string | null
          flat_id: string
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          flat_id: string
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          flat_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          end_date: string | null
          flat_id: string | null
          id: string
          name: string
          nid: string | null
          phone: string
          rent_amount: number
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          end_date?: string | null
          flat_id?: string | null
          id?: string
          name: string
          nid?: string | null
          phone: string
          rent_amount: number
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          end_date?: string | null
          flat_id?: string | null
          id?: string
          name?: string
          nid?: string | null
          phone?: string
          rent_amount?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      camera_status: "online" | "offline"
      employee_role: "guard" | "cleaner" | "caretaker" | "other"
      flat_status: "owner-occupied" | "tenant" | "vacant"
      invoice_status: "paid" | "unpaid" | "overdue"
      payment_method: "cash" | "bank" | "bkash" | "nagad" | "rocket" | "cheque"
      request_category:
        | "plumbing"
        | "electrical"
        | "elevator"
        | "common-area"
        | "other"
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status: "open" | "in-progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      camera_status: ["online", "offline"],
      employee_role: ["guard", "cleaner", "caretaker", "other"],
      flat_status: ["owner-occupied", "tenant", "vacant"],
      invoice_status: ["paid", "unpaid", "overdue"],
      payment_method: ["cash", "bank", "bkash", "nagad", "rocket", "cheque"],
      request_category: [
        "plumbing",
        "electrical",
        "elevator",
        "common-area",
        "other",
      ],
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: ["open", "in-progress", "resolved", "closed"],
    },
  },
} as const
