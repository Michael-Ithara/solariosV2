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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          max_progress: number
          points: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          max_progress?: number
          points?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          max_progress?: number
          points?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_forecasts: {
        Row: {
          created_at: string
          id: string
          model: string | null
          period_end: string
          period_start: string
          target: Database["public"]["Enums"]["forecast_target"]
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          period_end: string
          period_start: string
          target: Database["public"]["Enums"]["forecast_target"]
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          period_end?: string
          period_start?: string
          target?: Database["public"]["Enums"]["forecast_target"]
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          created_at: string
          description: string | null
          expected_savings_currency: number | null
          expected_savings_kwh: number | null
          id: string
          priority: Database["public"]["Enums"]["recommendation_priority"]
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expected_savings_currency?: number | null
          expected_savings_kwh?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expected_savings_currency?: number | null
          expected_savings_kwh?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appliances: {
        Row: {
          created_at: string
          id: string
          name: string
          power_rating_w: number | null
          status: Database["public"]["Enums"]["appliance_status"]
          total_kwh: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_achievements: {
        Row: {
          category: string | null
          code: string
          description: string | null
          id: string
          max_progress: number
          points: number
          progress: number
          title: string
          unlocked: boolean
          unlocked_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          description?: string | null
          id?: string
          max_progress?: number
          points?: number
          progress?: number
          title: string
          unlocked?: boolean
          unlocked_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          description?: string | null
          id?: string
          max_progress?: number
          points?: number
          progress?: number
          title?: string
          unlocked?: boolean
          unlocked_at?: string | null
        }
        Relationships: []
      }
      demo_alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
        }
        Relationships: []
      }
      demo_appliances: {
        Row: {
          created_at: string
          id: string
          name: string
          power_rating_w: number | null
          status: Database["public"]["Enums"]["appliance_status"]
          total_kwh: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
        }
        Relationships: []
      }
      demo_energy_logs: {
        Row: {
          appliance_name: string | null
          consumption_kwh: number
          id: string
          logged_at: string
        }
        Insert: {
          appliance_name?: string | null
          consumption_kwh: number
          id?: string
          logged_at?: string
        }
        Update: {
          appliance_name?: string | null
          consumption_kwh?: number
          id?: string
          logged_at?: string
        }
        Relationships: []
      }
      demo_solar_data: {
        Row: {
          generation_kwh: number
          id: string
          irradiance_wm2: number | null
          logged_at: string
        }
        Insert: {
          generation_kwh: number
          id?: string
          irradiance_wm2?: number | null
          logged_at?: string
        }
        Update: {
          generation_kwh?: number
          id?: string
          irradiance_wm2?: number | null
          logged_at?: string
        }
        Relationships: []
      }
      demo_user_points: {
        Row: {
          id: string
          level: number
          points: number
          updated_at: string
          xp: number
        }
        Insert: {
          id?: string
          level?: number
          points?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          id?: string
          level?: number
          points?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          appliance_id: string | null
          consumption_kwh: number
          created_at: string
          id: string
          logged_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appliance_id?: string | null
          consumption_kwh: number
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appliance_id?: string | null
          consumption_kwh?: number
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_logs_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          battery_capacity: number | null
          bio: string | null
          created_at: string
          currency: string
          dashboard_layout: string
          display_name: string | null
          electricity_rate: number
          email_notifications: boolean
          home_size_sqft: number | null
          id: string
          notifications_enabled: boolean
          occupants: number | null
          push_notifications: boolean
          solar_panel_capacity: number | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          battery_capacity?: number | null
          bio?: string | null
          created_at?: string
          currency?: string
          dashboard_layout?: string
          display_name?: string | null
          electricity_rate?: number
          email_notifications?: boolean
          home_size_sqft?: number | null
          id?: string
          notifications_enabled?: boolean
          occupants?: number | null
          push_notifications?: boolean
          solar_panel_capacity?: number | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          battery_capacity?: number | null
          bio?: string | null
          created_at?: string
          currency?: string
          dashboard_layout?: string
          display_name?: string | null
          electricity_rate?: number
          email_notifications?: boolean
          home_size_sqft?: number | null
          id?: string
          notifications_enabled?: boolean
          occupants?: number | null
          push_notifications?: boolean
          solar_panel_capacity?: number | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      real_time_energy_data: {
        Row: {
          active_devices: number
          battery_level_percent: number
          cloud_cover_percent: number | null
          consumption_kw: number
          created_at: string
          grid_usage_kw: number
          id: string
          solar_production_kw: number
          temperature_celsius: number | null
          timestamp: string
          total_devices: number
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          active_devices?: number
          battery_level_percent?: number
          cloud_cover_percent?: number | null
          consumption_kw?: number
          created_at?: string
          grid_usage_kw?: number
          id?: string
          solar_production_kw?: number
          temperature_celsius?: number | null
          timestamp?: string
          total_devices?: number
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          active_devices?: number
          battery_level_percent?: number
          cloud_cover_percent?: number | null
          consumption_kw?: number
          created_at?: string
          grid_usage_kw?: number
          id?: string
          solar_production_kw?: number
          temperature_celsius?: number | null
          timestamp?: string
          total_devices?: number
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: []
      }
      solar_data: {
        Row: {
          created_at: string
          generation_kwh: number
          id: string
          irradiance_wm2: number | null
          logged_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_kwh: number
          id?: string
          irradiance_wm2?: number | null
          logged_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_kwh?: number
          id?: string
          irradiance_wm2?: number | null
          logged_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          level: number
          points: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          points?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          points?: number
          updated_at?: string
          user_id?: string
          xp?: number
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
      alert_severity: "info" | "warning" | "critical"
      appliance_status: "on" | "off"
      forecast_target: "consumption" | "generation" | "savings"
      recommendation_priority: "low" | "medium" | "high"
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
      alert_severity: ["info", "warning", "critical"],
      appliance_status: ["on", "off"],
      forecast_target: ["consumption", "generation", "savings"],
      recommendation_priority: ["low", "medium", "high"],
    },
  },
} as const
