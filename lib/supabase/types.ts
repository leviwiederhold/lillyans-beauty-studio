export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Row<T> = T & Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Row<{ id: string; email: string | null; full_name: string | null; role: "client" | "admin"; is_admin: boolean; created_at: string; updated_at: string }>;
        Insert: { id: string; email?: string | null; full_name?: string | null; role?: "client" | "admin"; is_admin?: boolean };
        Update: { email?: string | null; full_name?: string | null; role?: "client" | "admin"; is_admin?: boolean; updated_at?: string };
      };
      clients: {
        Row: Row<{ id: string; profile_id: string | null; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; created_at: string; updated_at: string }>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      services: {
        Row: Row<{ id: string; category_id: string | null; name: string; description: string | null; service_total: number | null; duration_minutes: number; requires_intake: boolean; intake_type: string | null; requires_deposit: boolean; is_active: boolean; sort_order: number }>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      service_categories: {
        Row: Row<{ id: string; name: string; description: string | null; sort_order: number; is_active: boolean }>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      bookings: {
        Row: Row<{ id: string; client_id: string | null; service_id: string | null; client_name: string | null; email: string | null; service_type: string; status: string; starts_at: string | null; ends_at: string | null; deposit_required: boolean; deposit_status: string; created_at: string; updated_at: string }>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      business_hours: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      availability_rules: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      blocked_times: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      intake_forms: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      memberships: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      gallery_items: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      business_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      gift_card_codes: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      gift_card_code_redemptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      contact_inquiries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      deposits: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      admin_audit_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      automation_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      error_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
