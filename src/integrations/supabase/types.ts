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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      building_members: {
        Row: {
          approved_by: string | null
          building_id: string
          created_at: string
          flat_id: string | null
          id: string
          is_approved: boolean
          is_primary: boolean
          role: Database["public"]["Enums"]["building_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          building_id: string
          created_at?: string
          flat_id?: string | null
          id?: string
          is_approved?: boolean
          is_primary?: boolean
          role: Database["public"]["Enums"]["building_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          building_id?: string
          created_at?: string
          flat_id?: string | null
          id?: string
          is_approved?: boolean
          is_primary?: boolean
          role?: Database["public"]["Enums"]["building_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_members_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_members_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          district: string | null
          id: string
          join_code: string
          name: string
          number_of_flats: number | null
          number_of_floors: number | null
          occupancy_cert_number: string | null
          org_id: string
          rajuk_approval_number: string | null
          registered_office: string | null
          thana: string | null
          updated_at: string
          ward: string | null
          year_constructed: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          district?: string | null
          id?: string
          join_code: string
          name: string
          number_of_flats?: number | null
          number_of_floors?: number | null
          occupancy_cert_number?: string | null
          org_id: string
          rajuk_approval_number?: string | null
          registered_office?: string | null
          thana?: string | null
          updated_at?: string
          ward?: string | null
          year_constructed?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          district?: string | null
          id?: string
          join_code?: string
          name?: string
          number_of_flats?: number | null
          number_of_floors?: number | null
          occupancy_cert_number?: string | null
          org_id?: string
          rajuk_approval_number?: string | null
          registered_office?: string | null
          thana?: string | null
          updated_at?: string
          ward?: string | null
          year_constructed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          building_id: string | null
          camera_id: string | null
          created_at: string
          id: string
          location: string
          name: string
          status: Database["public"]["Enums"]["camera_status"]
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          camera_id?: string | null
          created_at?: string
          id?: string
          location: string
          name: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          camera_id?: string | null
          created_at?: string
          id?: string
          location?: string
          name?: string
          status?: Database["public"]["Enums"]["camera_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cameras_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          building_id: string
          created_at: string
          document_type: string
          expires_on: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          issuing_authority: string | null
          notes: string | null
          reference_number: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          document_type: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuing_authority?: string | null
          notes?: string | null
          reference_number?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          document_type?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          issuing_authority?: string | null
          notes?: string | null
          reference_number?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          building_id: string | null
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
          building_id?: string | null
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
          building_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "employees_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          building_id: string | null
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
          building_id?: string | null
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
          building_id?: string | null
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
            foreignKeyName: "expenses_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
          building_id: string | null
          building_name: string | null
          created_at: string
          display_order: number | null
          flat_number: string
          floor: number
          id: string
          parking_spot: string | null
          size: number
          status: Database["public"]["Enums"]["flat_status"]
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          building_name?: string | null
          created_at?: string
          display_order?: number | null
          flat_number: string
          floor: number
          id?: string
          parking_spot?: string | null
          size?: number
          status?: Database["public"]["Enums"]["flat_status"]
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          building_name?: string | null
          created_at?: string
          display_order?: number | null
          flat_number?: string
          floor?: number
          id?: string
          parking_spot?: string | null
          size?: number
          status?: Database["public"]["Enums"]["flat_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flats_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      generator_run_allocations: {
        Row: {
          created_at: string
          flat_id: string
          generator_run_id: string
          id: string
          invoice_id: string | null
          share_amount: number
        }
        Insert: {
          created_at?: string
          flat_id: string
          generator_run_id: string
          id?: string
          invoice_id?: string | null
          share_amount: number
        }
        Update: {
          created_at?: string
          flat_id?: string
          generator_run_id?: string
          id?: string
          invoice_id?: string | null
          share_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "generator_run_allocations_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generator_run_allocations_generator_run_id_fkey"
            columns: ["generator_run_id"]
            isOneToOne: false
            referencedRelation: "generator_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generator_run_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      generator_runs: {
        Row: {
          building_id: string
          created_at: string
          ended_at: string
          fuel_liters: number
          fuel_price_per_liter: number
          id: string
          is_allocated: boolean
          logged_by: string | null
          notes: string | null
          reason: string
          started_at: string
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          ended_at: string
          fuel_liters: number
          fuel_price_per_liter: number
          id?: string
          is_allocated?: boolean
          logged_by?: string | null
          notes?: string | null
          reason?: string
          started_at: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          ended_at?: string
          fuel_liters?: number
          fuel_price_per_liter?: number
          id?: string
          is_allocated?: boolean
          logged_by?: string | null
          notes?: string | null
          reason?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generator_runs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          building_id: string | null
          created_at: string
          description: string | null
          due_date: string
          flat_id: string
          id: string
          invoice_type: string
          month: string
          paid_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          year: number
        }
        Insert: {
          amount: number
          building_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          flat_id: string
          id?: string
          invoice_type?: string
          month: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          building_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          flat_id?: string
          id?: string
          invoice_type?: string
          month?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          created_at: string
          equipment_name: string
          equipment_type: string
          frequency_days: number
          id: string
          last_maintenance_date: string | null
          location: string | null
          next_maintenance_date: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          created_at?: string
          equipment_name: string
          equipment_type: string
          frequency_days?: number
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          next_maintenance_date: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          created_at?: string
          equipment_name?: string
          equipment_type?: string
          frequency_days?: number
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          next_maintenance_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          primary_contact_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          primary_contact_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          primary_contact_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_flats: {
        Row: {
          created_at: string
          flat_id: string
          id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          flat_id: string
          id?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          flat_id?: string
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_flats_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_flats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          building_id: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          flat_id: string | null
          id: string
          name: string
          nid: string | null
          owner_number: number
          ownership_start: string
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          flat_id?: string | null
          id?: string
          name: string
          nid?: string | null
          owner_number?: number
          ownership_start?: string
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          flat_id?: string | null
          id?: string
          name?: string
          nid?: string | null
          owner_number?: number
          ownership_start?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owners_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owners_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          building_id: string
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          payer_phone: string | null
          reference: string | null
          rejection_reason: string | null
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          building_id: string
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          payer_phone?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          building_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          payer_phone?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          building_id: string | null
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
          building_id?: string | null
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
          building_id?: string | null
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
            foreignKeyName: "payments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
      payroll_entries: {
        Row: {
          advance_adjustment: number
          base_salary: number
          bonuses: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net_amount: number
          notes: string | null
          payroll_period_id: string
          updated_at: string
        }
        Insert: {
          advance_adjustment?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net_amount?: number
          notes?: string | null
          payroll_period_id: string
          updated_at?: string
        }
        Update: {
          advance_adjustment?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net_amount?: number
          notes?: string | null
          payroll_period_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          finalized_at: string | null
          id: string
          month: string
          status: string
          total_amount: number
          updated_at: string
          year: number
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          finalized_at?: string | null
          id?: string
          month: string
          status?: string
          total_amount?: number
          updated_at?: string
          year: number
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          finalized_at?: string | null
          id?: string
          month?: string
          status?: string
          total_amount?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
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
      property_documents: {
        Row: {
          building_id: string | null
          building_name: string
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          building_id?: string | null
          building_name: string
          created_at?: string
          document_name: string
          document_type?: string
          file_path: string
          file_size?: number | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          building_id?: string | null
          building_name?: string
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          attempted_at: string
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          attempted_at?: string
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          attempted_at?: string
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["request_category"]
          cost: number | null
          created_at: string
          description: string | null
          flat_id: string
          id: string
          invoice_id: string | null
          priority: Database["public"]["Enums"]["request_priority"]
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          ticket_number: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          flat_id: string
          id?: string
          invoice_id?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          ticket_number?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          flat_id?: string
          id?: string
          invoice_id?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          ticket_number?: number
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
            foreignKeyName: "service_requests_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_alerts: {
        Row: {
          alert_type: string
          building_id: string | null
          created_at: string
          description: string | null
          flat_id: string | null
          id: string
          is_resolved: boolean
          resolved_at: string | null
          severity: string
          title: string
          utility_type: string | null
        }
        Insert: {
          alert_type: string
          building_id?: string | null
          created_at?: string
          description?: string | null
          flat_id?: string | null
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          severity?: string
          title: string
          utility_type?: string | null
        }
        Update: {
          alert_type?: string
          building_id?: string | null
          created_at?: string
          description?: string | null
          flat_id?: string | null
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          severity?: string
          title?: string
          utility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_alerts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_alerts_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          building_id: string
          check_in_at: string
          check_out_at: string | null
          created_at: string
          employee_id: string
          id: string
          method: string
          notes: string | null
          recorded_by: string | null
          shift_id: string | null
        }
        Insert: {
          building_id: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          method?: string
          notes?: string | null
          recorded_by?: string | null
          shift_id?: string | null
        }
        Update: {
          building_id?: string
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          method?: string
          notes?: string | null
          recorded_by?: string | null
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          building_id: string
          created_at: string
          employee_id: string
          end_time: string
          id: string
          notes: string | null
          shift_date: string
          start_time: string
        }
        Insert: {
          building_id: string
          created_at?: string
          employee_id: string
          end_time: string
          id?: string
          notes?: string | null
          shift_date: string
          start_time: string
        }
        Update: {
          building_id?: string
          created_at?: string
          employee_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          shift_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_readings: {
        Row: {
          building_id: string | null
          created_at: string
          flat_id: string | null
          humidity: number | null
          hvac_mode: string | null
          id: string
          location: string
          reading_time: string
          target_temperature: number | null
          temperature: number
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          flat_id?: string | null
          humidity?: number | null
          hvac_mode?: string | null
          id?: string
          location?: string
          reading_time?: string
          target_temperature?: number | null
          temperature: number
        }
        Update: {
          building_id?: string | null
          created_at?: string
          flat_id?: string | null
          humidity?: number | null
          hvac_mode?: string | null
          id?: string
          location?: string
          reading_time?: string
          target_temperature?: number | null
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "temperature_readings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temperature_readings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          agreement_agreed_at: string | null
          agreement_status: string | null
          agreement_token: string | null
          building_id: string | null
          created_at: string
          email: string | null
          end_date: string | null
          flat_id: string | null
          house_rules: string | null
          id: string
          invitation_sent_at: string | null
          maintenance_responsibilities: string | null
          name: string
          nid: string | null
          phone: string
          rent_amount: number
          security_deposit: number | null
          start_date: string
          tenant_number: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agreement_agreed_at?: string | null
          agreement_status?: string | null
          agreement_token?: string | null
          building_id?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          flat_id?: string | null
          house_rules?: string | null
          id?: string
          invitation_sent_at?: string | null
          maintenance_responsibilities?: string | null
          name: string
          nid?: string | null
          phone: string
          rent_amount: number
          security_deposit?: number | null
          start_date?: string
          tenant_number?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agreement_agreed_at?: string | null
          agreement_status?: string | null
          agreement_token?: string | null
          building_id?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          flat_id?: string | null
          house_rules?: string | null
          id?: string
          invitation_sent_at?: string | null
          maintenance_responsibilities?: string | null
          name?: string
          nid?: string | null
          phone?: string
          rent_amount?: number
          security_deposit?: number | null
          start_date?: string
          tenant_number?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
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
          approved_by_owner_id: string | null
          created_at: string
          id: string
          is_approved: boolean
          requested_role: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved_by_owner_id?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          requested_role?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved_by_owner_id?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          requested_role?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_approved_by_owner_id_fkey"
            columns: ["approved_by_owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_bills: {
        Row: {
          amount: number
          bill_month: string
          bill_type: string
          bill_year: number
          building_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          flat_id: string | null
          id: string
          paid_by: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          amount?: number
          bill_month: string
          bill_type?: string
          bill_year: number
          building_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          flat_id?: string | null
          id?: string
          paid_by?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          amount?: number
          bill_month?: string
          bill_type?: string
          bill_year?: number
          building_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          flat_id?: string | null
          id?: string
          paid_by?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_bills_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_bills_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_readings: {
        Row: {
          building_id: string | null
          cost_per_unit: number
          created_at: string
          flat_id: string | null
          id: string
          is_building_wide: boolean
          reading_date: string
          reading_value: number
          unit: string
          utility_type: string
        }
        Insert: {
          building_id?: string | null
          cost_per_unit?: number
          created_at?: string
          flat_id?: string | null
          id?: string
          is_building_wide?: boolean
          reading_date?: string
          reading_value?: number
          unit?: string
          utility_type: string
        }
        Update: {
          building_id?: string | null
          cost_per_unit?: number
          created_at?: string
          flat_id?: string | null
          id?: string
          is_building_wide?: boolean
          reading_date?: string
          reading_value?: number
          unit?: string
          utility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_readings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_generator_run: {
        Args: {
          _description_prefix?: string
          _due_date?: string
          _method?: string
          _run_id: string
        }
        Returns: string
      }
      approve_payment_intent: { Args: { _intent_id: string }; Returns: string }
      bootstrap_building: {
        Args: {
          _building_address?: string
          _building_name: string
          _district?: string
          _number_of_flats?: number
          _number_of_floors?: number
          _org_name: string
          _org_type: string
          _thana?: string
          _ward?: string
          _year_constructed?: number
        }
        Returns: string
      }
      can_manage_building: {
        Args: { _building_id: string; _user_id: string }
        Returns: boolean
      }
      current_user_buildings: { Args: { _user_id: string }; Returns: string[] }
      generate_payroll_period: {
        Args: { _building_id: string; _month: string; _year: number }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_building_member: {
        Args: {
          _building_id: string
          _role?: Database["public"]["Enums"]["building_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_of_flat: {
        Args: { _flat_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_building_by_code: {
        Args: { _join_code: string }
        Returns: {
          address: string
          id: string
          name: string
        }[]
      }
      reject_payment_intent: {
        Args: { _intent_id: string; _reason: string }
        Returns: undefined
      }
      request_building_membership: {
        Args: {
          _join_code: string
          _role: Database["public"]["Enums"]["building_role"]
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner" | "tenant"
      building_role:
        | "committee"
        | "manager"
        | "staff"
        | "vendor"
        | "landlord_owner"
        | "resident_owner"
        | "tenant"
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
      app_role: ["admin", "user", "owner", "tenant"],
      building_role: [
        "committee",
        "manager",
        "staff",
        "vendor",
        "landlord_owner",
        "resident_owner",
        "tenant",
      ],
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
