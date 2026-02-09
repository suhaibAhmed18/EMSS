// Generated Supabase database types
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
      stores: {
        Row: {
          id: string
          shop_domain: string
          access_token: string
          scopes: string[]
          user_id: string | null
          display_name: string | null
          description: string | null
          logo_url: string | null
          is_active: boolean
          plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
          subscription_status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          timezone: string
          currency: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_domain: string
          access_token: string
          scopes: string[]
          user_id?: string | null
          display_name?: string | null
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          plan_type?: 'free' | 'starter' | 'professional' | 'enterprise'
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          timezone?: string
          currency?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_domain?: string
          access_token?: string
          scopes?: string[]
          user_id?: string | null
          display_name?: string | null
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          plan_type?: 'free' | 'starter' | 'professional' | 'enterprise'
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'unpaid'
          timezone?: string
          currency?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          store_id: string
          email: string
          phone: string | null
          first_name: string | null
          last_name: string | null
          shopify_customer_id: string | null
          tags: string[]
          segments: string[]
          email_consent: boolean
          sms_consent: boolean
          total_spent: number
          order_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          email: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          shopify_customer_id?: string | null
          tags?: string[]
          segments?: string[]
          email_consent?: boolean
          sms_consent?: boolean
          total_spent?: number
          order_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          email?: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          shopify_customer_id?: string | null
          tags?: string[]
          segments?: string[]
          email_consent?: boolean
          sms_consent?: boolean
          total_spent?: number
          order_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          store_id: string
          name: string
          subject: string
          html_content: string
          text_content: string | null
          from_email: string
          from_name: string
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          recipient_count: number
          delivered_count: number
          opened_count: number
          clicked_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          subject: string
          html_content: string
          text_content?: string | null
          from_email: string
          from_name: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          recipient_count?: number
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          subject?: string
          html_content?: string
          text_content?: string | null
          from_email?: string
          from_name?: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          recipient_count?: number
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      sms_campaigns: {
        Row: {
          id: string
          store_id: string
          name: string
          message: string
          from_number: string
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          recipient_count: number
          delivered_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          message: string
          from_number: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          recipient_count?: number
          delivered_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          message?: string
          from_number?: string
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          recipient_count?: number
          delivered_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaign_sends: {
        Row: {
          id: string
          campaign_id: string
          campaign_type: 'email' | 'sms'
          contact_id: string
          status: 'pending' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
          external_message_id: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          clicked_at: string | null
          bounced_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          campaign_type: 'email' | 'sms'
          contact_id: string
          status?: 'pending' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
          external_message_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          bounced_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          campaign_type?: 'email' | 'sms'
          contact_id?: string
          status?: 'pending' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
          external_message_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          bounced_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      automation_workflows: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string | null
          trigger_type: string
          trigger_config: Json
          actions: Json[]
          conditions: Json[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          description?: string | null
          trigger_type: string
          trigger_config: Json
          actions?: Json[]
          conditions?: Json[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          description?: string | null
          trigger_type?: string
          trigger_config?: Json
          actions?: Json[]
          conditions?: Json[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      consent_records: {
        Row: {
          id: string
          contact_id: string
          type: 'email' | 'sms'
          consented: boolean
          source: 'shopify' | 'manual' | 'campaign' | 'api'
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          type: 'email' | 'sms'
          consented: boolean
          source: 'shopify' | 'manual' | 'campaign' | 'api'
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          type?: 'email' | 'sms'
          consented?: boolean
          source?: 'shopify' | 'manual' | 'campaign' | 'api'
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shopify_orders: {
        Row: {
          id: string
          store_id: string
          shopify_order_id: string
          order_number: string
          email: string
          total_price: number
          currency: string
          financial_status: string
          fulfillment_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          shopify_order_id: string
          order_number: string
          email: string
          total_price: number
          currency: string
          financial_status: string
          fulfillment_status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          shopify_order_id?: string
          order_number?: string
          email?: string
          total_price?: number
          currency?: string
          financial_status?: string
          fulfillment_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          store_id: string
          topic: string
          payload: Json
          processed: boolean
          processed_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          topic: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          topic?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          metric: string
          value: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          metric: string
          value: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          metric?: string
          value?: number
          metadata?: Json
          created_at?: string
        }
      }
      performance_alerts: {
        Row: {
          id: string
          metric: string
          value: number
          threshold: number
          severity: 'low' | 'medium' | 'high' | 'critical'
          created_at: string
        }
        Insert: {
          id?: string
          metric: string
          value: number
          threshold: number
          severity: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
        }
        Update: {
          id?: string
          metric?: string
          value?: number
          threshold?: number
          severity?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
        }
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          identifier: string
          details: Json
          severity: 'low' | 'medium' | 'high' | 'critical'
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          identifier: string
          details: Json
          severity: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          identifier?: string
          details?: Json
          severity?: 'low' | 'medium' | 'high' | 'critical'
          created_at?: string
        }
      }
      ip_blocks: {
        Row: {
          id: string
          ip_address: string
          reason: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          reason: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          reason?: string
          expires_at?: string
          created_at?: string
        }
      }
      request_logs: {
        Row: {
          id: string
          ip_address: string
          endpoint: string
          method: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          endpoint: string
          method: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          endpoint?: string
          method?: string
          user_agent?: string | null
          created_at?: string
        }
      }
      campaign_templates: {
        Row: {
          id: string
          store_id: string
          name: string
          type: 'email' | 'sms'
          content: string
          variables: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          type: 'email' | 'sms'
          content: string
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          type?: 'email' | 'sms'
          content?: string
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      shopify_products: {
        Row: {
          id: string
          store_id: string
          shopify_product_id: string
          title: string
          handle: string
          product_type: string
          vendor: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          shopify_product_id: string
          title: string
          handle: string
          product_type: string
          vendor: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          shopify_product_id?: string
          title?: string
          handle?: string
          product_type?: string
          vendor?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_stores: {
        Row: {
          id: string
          user_id: string
          store_id: string
          role: 'admin' | 'manager' | 'viewer'
          permissions: Json
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          role?: 'admin' | 'manager' | 'viewer'
          permissions?: Json
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          role?: 'admin' | 'manager' | 'viewer'
          permissions?: Json
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      store_activity_log: {
        Row: {
          id: string
          store_id: string
          user_id: string
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          user_id?: string
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      store_analytics: {
        Row: {
          id: string
          store_id: string
          date: string
          metric_name: string
          metric_value: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          date: string
          metric_name: string
          metric_value: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          date?: string
          metric_name?: string
          metric_value?: number
          metadata?: Json
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          shopify_store_id: string | null
          role: 'merchant' | 'admin'
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          shopify_store_id?: string | null
          role?: 'merchant' | 'admin'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          shopify_store_id?: string | null
          role?: 'merchant' | 'admin'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          sql: string
        }
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}