export interface Database {
  public: {
    Tables: {
      offers: {
        Row: {
          id: string;
          project_id: string;
          contractor_id: string;
          owner_id: string;
          price_chf: number;
          message: string;
          attachments: string[] | null;
          status: "submitted" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          contractor_id: string;
          owner_id: string;
          price_chf: number;
          message: string;
          attachments?: string[] | null;
          status?: "submitted" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
      };
      chats: {
        Row: {
          id: string;
          project_id: string;
          offer_id: string | null;
          owner_id: string;
          contractor_id: string;
          owner_company_name: string | null;
          contractor_company_name: string | null;
          project_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          offer_id?: string | null;
          owner_id: string;
          contractor_id: string;
          owner_company_name?: string | null;
          contractor_company_name?: string | null;
          project_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chats"]["Insert"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          message: string;
          attachments: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          message: string;
          attachments?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
      };
      chat_user_settings: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          is_muted: boolean;
          is_favorite: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          is_muted?: boolean;
          is_favorite?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_user_settings"]["Insert"]>;
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocked_users"]["Insert"]>;
      };
      feature_flags: {
        Row: {
          id: string;
          name: string;
          enabled: boolean;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          enabled?: boolean;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "project" | "message";
          title: string;
          body: string | null;
          meta: Record<string, unknown> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "project" | "message";
          title: string;
          body?: string | null;
          meta?: Record<string, unknown> | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "project" | "user" | "message";
          target_id: string;
          reason: string;
          status: "open" | "resolved";
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "project" | "user" | "message";
          target_id: string;
          reason: string;
          status?: "open" | "resolved";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          address: string;
          category: string;
          project_type: string | null;
          service: string;
          deadline: string;
          status: "active" | "closed";
          attachments: string[] | null;
          owner_company_name: string | null;
          owner_profile_title: string | null;
          owner_avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          address: string;
          category: string;
          project_type?: string | null;
          service: string;
          deadline: string;
          status?: "active" | "closed";
          attachments?: string[] | null;
          owner_company_name?: string | null;
          owner_profile_title?: string | null;
          owner_avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          actor_id: string | null;
          target_user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          details: Record<string, unknown>;
          severity: "info" | "warning" | "critical";
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          actor_id?: string | null;
          target_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Record<string, unknown>;
          severity?: "info" | "warning" | "critical";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["security_events"]["Insert"]>;
      };
      settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          key: string;
          value?: Record<string, unknown>;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          company_name: string;
          profile_title: string | null;
          avatar_url: string | null;
          role: "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
          is_verified: boolean;
          is_banned: boolean;
          trust_score: number;
          last_login_at: string | null;
          deleted_at: string | null;
          stripe_customer_id: string | null;
          subscription_status: "active" | "canceled" | "past_due" | "none";
          plan_type: "basic" | "pro" | null;
          offer_count_this_month: number;
          subscription_current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          company_name: string;
          profile_title?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
          is_verified?: boolean;
          is_banned?: boolean;
          trust_score?: number;
          last_login_at?: string | null;
          deleted_at?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: "active" | "canceled" | "past_due" | "none";
          plan_type?: "basic" | "pro" | null;
          offer_count_this_month?: number;
          subscription_current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
    };
  };
}
