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
      anomaly_detections: {
        Row: {
          actual_value: number | null
          anomaly_score: number
          anomaly_type: string
          contributing_factors: Json | null
          created_at: string | null
          deviation_percent: number | null
          expected_value: number | null
          id: string
          is_confirmed: boolean | null
          resolution_notes: string | null
          severity: string
          timestamp: string
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          anomaly_score: number
          anomaly_type: string
          contributing_factors?: Json | null
          created_at?: string | null
          deviation_percent?: number | null
          expected_value?: number | null
          id?: string
          is_confirmed?: boolean | null
          resolution_notes?: string | null
          severity?: string
          timestamp: string
          user_id: string
        }
        Update: {
          actual_value?: number | null
          anomaly_score?: number
          anomaly_type?: string
          contributing_factors?: Json | null
          created_at?: string | null
          deviation_percent?: number | null
          expected_value?: number | null
          id?: string
          is_confirmed?: boolean | null
          resolution_notes?: string | null
          severity?: string
          timestamp?: string
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
      circuits: {
        Row: {
          breaker_rating_amps: number | null
          created_at: string
          id: string
          meter_id: string
          name: string
        }
        Insert: {
          breaker_rating_amps?: number | null
          created_at?: string
          id?: string
          meter_id: string
          name: string
        }
        Update: {
          breaker_rating_amps?: number | null
          created_at?: string
          id?: string
          meter_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuits_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "smart_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      co2_tracker: {
        Row: {
          co2_saved_kg: number
          created_at: string
          grid_kwh: number
          id: string
          solar_kwh: number
          timestamp: string
          user_id: string
        }
        Insert: {
          co2_saved_kg?: number
          created_at?: string
          grid_kwh?: number
          id?: string
          solar_kwh?: number
          timestamp?: string
          user_id: string
        }
        Update: {
          co2_saved_kg?: number
          created_at?: string
          grid_kwh?: number
          id?: string
          solar_kwh?: number
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      data_ingestion_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          file_name: string | null
          file_size_bytes: number | null
          id: string
          job_type: string
          processing_time_ms: number | null
          records_failed: number | null
          records_processed: number | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          job_type: string
          processing_time_ms?: number | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          job_type?: string
          processing_time_ms?: number | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
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
      device_instances: {
        Row: {
          circuit_id: string | null
          created_at: string
          id: string
          meter_id: string
          name: string
          power_rating_w: number | null
          status: Database["public"]["Enums"]["appliance_status"]
          total_kwh: number
          updated_at: string
        }
        Insert: {
          circuit_id?: string | null
          created_at?: string
          id?: string
          meter_id: string
          name: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
          updated_at?: string
        }
        Update: {
          circuit_id?: string | null
          created_at?: string
          id?: string
          meter_id?: string
          name?: string
          power_rating_w?: number | null
          status?: Database["public"]["Enums"]["appliance_status"]
          total_kwh?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_instances_circuit_id_fkey"
            columns: ["circuit_id"]
            isOneToOne: false
            referencedRelation: "circuits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_instances_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "smart_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_insights: {
        Row: {
          confidence_score: number
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_actionable: boolean | null
          is_dismissed: boolean | null
          metadata: Json | null
          potential_savings_currency: number | null
          potential_savings_kwh: number | null
          priority: string
          source_id: string | null
          source_type: string
          title: string
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_actionable?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
          potential_savings_currency?: number | null
          potential_savings_kwh?: number | null
          priority?: string
          source_id?: string | null
          source_type: string
          title: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
          potential_savings_currency?: number | null
          potential_savings_kwh?: number | null
          priority?: string
          source_id?: string | null
          source_type?: string
          title?: string
          user_id?: string
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
      grid_prices: {
        Row: {
          created_at: string
          id: string
          price_per_kwh: number
          price_tier: string
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_per_kwh?: number
          price_tier?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price_per_kwh?: number
          price_tier?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      insight_rules: {
        Row: {
          action_type: string
          category: string
          conditions: Json
          cooldown_hours: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_confidence: number | null
          priority: number
          recommendation_template: string | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          category: string
          conditions: Json
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_confidence?: number | null
          priority?: number
          recommendation_template?: string | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          category?: string
          conditions?: Json
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_confidence?: number | null
          priority?: number
          recommendation_template?: string | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inverters: {
        Row: {
          capacity_kw: number | null
          created_at: string
          id: string
          manufacturer: string | null
          meter_id: string
          model: string | null
          name: string
        }
        Insert: {
          capacity_kw?: number | null
          created_at?: string
          id?: string
          manufacturer?: string | null
          meter_id: string
          model?: string | null
          name: string
        }
        Update: {
          capacity_kw?: number | null
          created_at?: string
          id?: string
          manufacturer?: string | null
          meter_id?: string
          model?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inverters_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "smart_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_models: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json
          hyperparameters: Json | null
          id: string
          is_active: boolean | null
          model_artifact_url: string | null
          model_name: string
          model_type: string
          target_variable: string
          training_data_end: string | null
          training_data_start: string | null
          updated_at: string | null
          validation_score: number | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features: Json
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          model_artifact_url?: string | null
          model_name: string
          model_type: string
          target_variable: string
          training_data_end?: string | null
          training_data_start?: string | null
          updated_at?: string | null
          validation_score?: number | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          model_artifact_url?: string | null
          model_name?: string
          model_type?: string
          target_variable?: string
          training_data_end?: string | null
          training_data_start?: string | null
          updated_at?: string | null
          validation_score?: number | null
          version?: string
        }
        Relationships: []
      }
      ml_predictions: {
        Row: {
          actual_value: number | null
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          confidence_score: number | null
          created_at: string | null
          features_used: Json | null
          id: string
          model_id: string
          predicted_value: number
          prediction_error: number | null
          prediction_horizon: unknown
          prediction_type: string
          timestamp: string
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          confidence_score?: number | null
          created_at?: string | null
          features_used?: Json | null
          id?: string
          model_id: string
          predicted_value: number
          prediction_error?: number | null
          prediction_horizon: unknown
          prediction_type: string
          timestamp: string
          user_id: string
        }
        Update: {
          actual_value?: number | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          confidence_score?: number | null
          created_at?: string | null
          features_used?: Json | null
          id?: string
          model_id?: string
          predicted_value?: number
          prediction_error?: number | null
          prediction_horizon?: unknown
          prediction_type?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_features: {
        Row: {
          appliance_count: number | null
          consumption_kw: number
          consumption_trend_1h: number | null
          consumption_trend_24h: number | null
          cost_usd: number
          created_at: string | null
          day_of_week: number
          efficiency_ratio: number | null
          hour_of_day: number
          id: string
          is_holiday: boolean | null
          is_weekend: boolean
          month: number
          net_usage_kw: number
          peak_demand_indicator: boolean | null
          solar_generation_kw: number
          solar_irradiance_wm2: number | null
          solar_trend_1h: number | null
          temperature_celsius: number | null
          timestamp: string
          user_id: string
          weather_score: number | null
        }
        Insert: {
          appliance_count?: number | null
          consumption_kw: number
          consumption_trend_1h?: number | null
          consumption_trend_24h?: number | null
          cost_usd: number
          created_at?: string | null
          day_of_week: number
          efficiency_ratio?: number | null
          hour_of_day: number
          id?: string
          is_holiday?: boolean | null
          is_weekend: boolean
          month: number
          net_usage_kw: number
          peak_demand_indicator?: boolean | null
          solar_generation_kw: number
          solar_irradiance_wm2?: number | null
          solar_trend_1h?: number | null
          temperature_celsius?: number | null
          timestamp: string
          user_id: string
          weather_score?: number | null
        }
        Update: {
          appliance_count?: number | null
          consumption_kw?: number
          consumption_trend_1h?: number | null
          consumption_trend_24h?: number | null
          cost_usd?: number
          created_at?: string | null
          day_of_week?: number
          efficiency_ratio?: number | null
          hour_of_day?: number
          id?: string
          is_holiday?: boolean | null
          is_weekend?: boolean
          month?: number
          net_usage_kw?: number
          peak_demand_indicator?: boolean | null
          solar_generation_kw?: number
          solar_irradiance_wm2?: number | null
          solar_trend_1h?: number | null
          temperature_celsius?: number | null
          timestamp?: string
          user_id?: string
          weather_score?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          battery_capacity: number | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          dashboard_layout: string
          data_source: string
          display_name: string | null
          electricity_rate: number
          email_notifications: boolean
          has_solar_system: boolean | null
          home_size_sqft: number | null
          id: string
          notifications_enabled: boolean
          occupants: number | null
          push_notifications: boolean
          smart_meter_brand: string | null
          smart_meter_connection_method: string | null
          smart_meter_model: string | null
          smart_meter_type: string | null
          solar_installation_date: string | null
          solar_inverter_brand: string | null
          solar_panel_capacity: number | null
          solar_panel_count: number | null
          theme: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          battery_capacity?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          dashboard_layout?: string
          data_source?: string
          display_name?: string | null
          electricity_rate?: number
          email_notifications?: boolean
          has_solar_system?: boolean | null
          home_size_sqft?: number | null
          id?: string
          notifications_enabled?: boolean
          occupants?: number | null
          push_notifications?: boolean
          smart_meter_brand?: string | null
          smart_meter_connection_method?: string | null
          smart_meter_model?: string | null
          smart_meter_type?: string | null
          solar_installation_date?: string | null
          solar_inverter_brand?: string | null
          solar_panel_capacity?: number | null
          solar_panel_count?: number | null
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          battery_capacity?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          dashboard_layout?: string
          data_source?: string
          display_name?: string | null
          electricity_rate?: number
          email_notifications?: boolean
          has_solar_system?: boolean | null
          home_size_sqft?: number | null
          id?: string
          notifications_enabled?: boolean
          occupants?: number | null
          push_notifications?: boolean
          smart_meter_brand?: string | null
          smart_meter_connection_method?: string | null
          smart_meter_model?: string | null
          smart_meter_type?: string | null
          solar_installation_date?: string | null
          solar_inverter_brand?: string | null
          solar_panel_capacity?: number | null
          solar_panel_count?: number | null
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_energy_data: {
        Row: {
          appliance_breakdown: Json | null
          battery_charge_kw: number | null
          battery_discharge_kw: number | null
          battery_level_percent: number | null
          consumption_kw: number
          created_at: string | null
          data_source: string | null
          grid_export_kw: number
          grid_import_kw: number
          grid_price_per_kwh: number | null
          id: string
          quality_score: number | null
          solar_generation_kw: number
          timestamp: string
          user_id: string
        }
        Insert: {
          appliance_breakdown?: Json | null
          battery_charge_kw?: number | null
          battery_discharge_kw?: number | null
          battery_level_percent?: number | null
          consumption_kw?: number
          created_at?: string | null
          data_source?: string | null
          grid_export_kw?: number
          grid_import_kw?: number
          grid_price_per_kwh?: number | null
          id?: string
          quality_score?: number | null
          solar_generation_kw?: number
          timestamp: string
          user_id: string
        }
        Update: {
          appliance_breakdown?: Json | null
          battery_charge_kw?: number | null
          battery_discharge_kw?: number | null
          battery_level_percent?: number | null
          consumption_kw?: number
          created_at?: string | null
          data_source?: string | null
          grid_export_kw?: number
          grid_import_kw?: number
          grid_price_per_kwh?: number | null
          id?: string
          quality_score?: number | null
          solar_generation_kw?: number
          timestamp?: string
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
      rule_evaluations: {
        Row: {
          conditions_met: boolean
          confidence_score: number | null
          created_at: string | null
          evaluation_data: Json | null
          id: string
          rule_id: string
          timestamp: string
          triggered_action: boolean | null
          user_id: string
        }
        Insert: {
          conditions_met: boolean
          confidence_score?: number | null
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          rule_id: string
          timestamp: string
          triggered_action?: boolean | null
          user_id: string
        }
        Update: {
          conditions_met?: boolean
          confidence_score?: number | null
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          rule_id?: string
          timestamp?: string
          triggered_action?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_evaluations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "insight_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_meters: {
        Row: {
          created_at: string
          id: string
          manufacturer: string | null
          model: string | null
          name: string
          serial_number: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          name: string
          serial_number?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manufacturer?: string | null
          model?: string | null
          name?: string
          serial_number?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          cloud_cover_percent: number | null
          created_at: string | null
          data_source: string | null
          humidity_percent: number | null
          id: string
          location_lat: number | null
          location_lng: number | null
          solar_irradiance_wm2: number | null
          temperature_celsius: number | null
          timestamp: string
          uv_index: number | null
          weather_condition: string | null
          wind_speed_kmh: number | null
        }
        Insert: {
          cloud_cover_percent?: number | null
          created_at?: string | null
          data_source?: string | null
          humidity_percent?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          solar_irradiance_wm2?: number | null
          temperature_celsius?: number | null
          timestamp: string
          uv_index?: number | null
          weather_condition?: string | null
          wind_speed_kmh?: number | null
        }
        Update: {
          cloud_cover_percent?: number | null
          created_at?: string | null
          data_source?: string | null
          humidity_percent?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          solar_irradiance_wm2?: number | null
          temperature_celsius?: number | null
          timestamp?: string
          uv_index?: number | null
          weather_condition?: string | null
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      v_appliances: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          power_rating_w: number | null
          status: Database["public"]["Enums"]["appliance_status"] | null
          total_kwh: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
      appliance_status: ["on", "off"],
      forecast_target: ["consumption", "generation", "savings"],
      recommendation_priority: ["low", "medium", "high"],
    },
  },
} as const
