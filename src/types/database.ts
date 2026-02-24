export interface Database {
  public: {
    Tables: {
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
