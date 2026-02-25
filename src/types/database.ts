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
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          company_name: string;
          profile_title: string | null;
          avatar_url: string | null;
          role: "owner" | "contractor";
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
          role: "owner" | "contractor";
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
