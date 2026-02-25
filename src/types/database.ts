export interface Database {
  public: {
    Tables: {
      offers: {
        Row: {
          id: string;
          project_id: string;
          contractor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          contractor_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
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
