import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportParams {
  reportType: 'energy_logs' | 'solar_data' | 'recommendations' | 'appliances' | 'co2_tracker' | 'all_users_summary';
  startDate?: string;
  endDate?: string;
  userId?: string; // For admin reports
}

function arrayToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return headers.join(',') + '\n';
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const params: ReportParams = await req.json();
    const { reportType, startDate, endDate, userId } = params;

    // Check if user is admin for admin reports
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = roleData?.role === 'admin';
    const targetUserId = (isAdmin && userId) ? userId : user.id;

    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'energy_logs': {
        let query = supabase
          .from('energy_logs')
          .select('logged_at, consumption_kwh, appliance_id, created_at')
          .eq('user_id', targetUserId)
          .order('logged_at', { ascending: false });

        if (startDate) query = query.gte('logged_at', startDate);
        if (endDate) query = query.lte('logged_at', endDate);

        const { data, error } = await query.limit(10000);
        if (error) throw error;

        csvContent = arrayToCSV(data || [], ['logged_at', 'consumption_kwh', 'appliance_id', 'created_at']);
        filename = `energy_logs_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'solar_data': {
        let query = supabase
          .from('solar_data')
          .select('logged_at, generation_kwh, irradiance_wm2, created_at')
          .eq('user_id', targetUserId)
          .order('logged_at', { ascending: false });

        if (startDate) query = query.gte('logged_at', startDate);
        if (endDate) query = query.lte('logged_at', endDate);

        const { data, error } = await query.limit(10000);
        if (error) throw error;

        csvContent = arrayToCSV(data || [], ['logged_at', 'generation_kwh', 'irradiance_wm2', 'created_at']);
        filename = `solar_data_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'recommendations': {
        let query = supabase
          .from('ai_recommendations')
          .select('title, description, priority, expected_savings_kwh, expected_savings_currency, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query.limit(1000);
        if (error) throw error;

        csvContent = arrayToCSV(data || [], ['title', 'description', 'priority', 'expected_savings_kwh', 'expected_savings_currency', 'created_at']);
        filename = `ai_recommendations_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'appliances': {
        const { data, error } = await supabase
          .from('appliances')
          .select('name, power_rating_w, status, total_kwh, created_at, updated_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        csvContent = arrayToCSV(data || [], ['name', 'power_rating_w', 'status', 'total_kwh', 'created_at', 'updated_at']);
        filename = `appliances_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'co2_tracker': {
        let query = supabase
          .from('co2_tracker')
          .select('timestamp, solar_kwh, grid_kwh, co2_saved_kg, created_at')
          .eq('user_id', targetUserId)
          .order('timestamp', { ascending: false });

        if (startDate) query = query.gte('timestamp', startDate);
        if (endDate) query = query.lte('timestamp', endDate);

        const { data, error } = await query.limit(10000);
        if (error) throw error;

        csvContent = arrayToCSV(data || [], ['timestamp', 'solar_kwh', 'grid_kwh', 'co2_saved_kg', 'created_at']);
        filename = `co2_tracker_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'all_users_summary': {
        if (!isAdmin) {
          throw new Error('Admin access required');
        }

        // Aggregate data for all users
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, electricity_rate, solar_panel_capacity, battery_capacity, occupants, home_size_sqft, data_source, created_at');

        if (profileError) throw profileError;

        const { data: energyLogs, error: energyError } = await supabase
          .from('energy_logs')
          .select('user_id, consumption_kwh');

        if (energyError) throw energyError;

        const { data: solarData, error: solarError } = await supabase
          .from('solar_data')
          .select('user_id, generation_kwh');

        if (solarError) throw solarError;

        // Calculate aggregates per user
        const userSummary = (profiles || []).map(profile => {
          const userEnergy = (energyLogs || []).filter(log => log.user_id === profile.user_id);
          const userSolar = (solarData || []).filter(data => data.user_id === profile.user_id);

          return {
            user_id: profile.user_id,
            display_name: profile.display_name || 'Unknown',
            total_consumption_kwh: userEnergy.reduce((sum, log) => sum + Number(log.consumption_kwh || 0), 0).toFixed(2),
            total_solar_kwh: userSolar.reduce((sum, data) => sum + Number(data.generation_kwh || 0), 0).toFixed(2),
            electricity_rate: profile.electricity_rate,
            solar_capacity: profile.solar_panel_capacity || 0,
            battery_capacity: profile.battery_capacity || 0,
            occupants: profile.occupants || 0,
            home_size_sqft: profile.home_size_sqft || 0,
            data_source: profile.data_source,
            created_at: profile.created_at,
          };
        });

        csvContent = arrayToCSV(userSummary, ['user_id', 'display_name', 'total_consumption_kwh', 'total_solar_kwh', 'electricity_rate', 'solar_capacity', 'battery_capacity', 'occupants', 'home_size_sqft', 'data_source', 'created_at']);
        filename = `all_users_summary_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        throw new Error('Invalid report type');
    }

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating CSV report:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
