import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportParams {
  reportType: 'comprehensive_analytics' | 'monthly_summary' | 'recommendations_report';
  startDate?: string;
  endDate?: string;
}

function generateHTMLReport(data: any, reportType: string): string {
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
      .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { color: #2563eb; font-size: 32px; margin-bottom: 10px; }
      .header p { color: #6b7280; font-size: 14px; }
      .section { margin-bottom: 30px; page-break-inside: avoid; }
      .section h2 { color: #1f2937; font-size: 22px; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 12px; }
      .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
      .metric-card { background: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #2563eb; }
      .metric-card h3 { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
      .metric-card p { color: #1f2937; font-size: 28px; font-weight: 600; }
      .metric-card span { color: #6b7280; font-size: 14px; font-weight: 400; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      th { background: #f9fafb; color: #6b7280; font-weight: 600; font-size: 13px; text-transform: uppercase; }
      td { color: #1f2937; }
      .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
      .recommendation h4 { color: #92400e; margin-bottom: 5px; }
      .recommendation p { color: #78350f; font-size: 14px; }
      .priority-high { border-left-color: #dc2626; background: #fee2e2; }
      .priority-medium { border-left-color: #f59e0b; background: #fef3c7; }
      .priority-low { border-left-color: #059669; background: #d1fae5; }
      .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
      @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
    </style>
  `;

  let content = '';

  if (reportType === 'comprehensive_analytics') {
    content = `
      <div class="header">
        <h1>Comprehensive Energy Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Report Period: ${data.startDate} to ${data.endDate}</p>
      </div>

      <div class="section">
        <h2>Energy Consumption Overview</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <h3>Total Consumption</h3>
            <p>${data.totalConsumption} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>Average Daily</h3>
            <p>${data.avgDailyConsumption} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>Peak Usage Hour</h3>
            <p>${data.peakHour}:00 <span>hrs</span></p>
          </div>
          <div class="metric-card">
            <h3>Total Cost</h3>
            <p>${data.currency}${data.totalCost}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Solar Generation</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <h3>Total Generation</h3>
            <p>${data.totalSolar} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>Self-Consumption</h3>
            <p>${data.solarSelfConsumption}%</p>
          </div>
          <div class="metric-card">
            <h3>Grid Export</h3>
            <p>${data.gridExport} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>CO₂ Saved</h3>
            <p>${data.co2Saved} <span>kg</span></p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Top Energy Consuming Appliances</h2>
        <table>
          <thead>
            <tr>
              <th>Appliance</th>
              <th>Power Rating</th>
              <th>Total Consumption</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.topAppliances?.map((app: any) => `
              <tr>
                <td>${app.name}</td>
                <td>${app.power_rating_w}W</td>
                <td>${app.total_kwh} kWh</td>
                <td>${app.status}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No appliance data</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === 'recommendations_report') {
    content = `
      <div class="header">
        <h1>AI Energy Recommendations Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="section">
        <h2>Personalized Recommendations</h2>
        ${data.recommendations?.map((rec: any) => `
          <div class="recommendation priority-${rec.priority}">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <p style="margin-top: 10px; font-weight: 600;">
              Expected Savings: ${rec.expected_savings_kwh} kWh/month (${data.currency}${rec.expected_savings_currency}/month)
            </p>
          </div>
        `).join('') || '<p>No recommendations available</p>'}
      </div>

      <div class="section">
        <h2>Forecast</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <h3>Next Month Consumption</h3>
            <p>${data.forecast?.nextMonthConsumption || 0} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>Next Month Solar</h3>
            <p>${data.forecast?.nextMonthSolar || 0} <span>kWh</span></p>
          </div>
          <div class="metric-card">
            <h3>Estimated Cost</h3>
            <p>${data.currency}${data.forecast?.nextMonthCost || 0}</p>
          </div>
          <div class="metric-card">
            <h3>Confidence</h3>
            <p>${data.forecast?.confidence || 'medium'}</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportType === 'comprehensive_analytics' ? 'Energy Analytics Report' : 'AI Recommendations Report'}</title>
      ${styles}
    </head>
    <body>
      ${content}
      <div class="footer">
        <p>This report was automatically generated by SolarOS Energy Management System</p>
        <p>For questions or support, contact your energy management team</p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  console.log('PDF Report Function - Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceKey 
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('User authentication:', { 
      userId: user?.id, 
      hasError: !!authError 
    });
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const params: ReportParams = await req.json();
    console.log('Report parameters:', params);
    const { reportType, startDate, endDate } = params;

    // Fetch profile for currency
    const { data: profile } = await supabase
      .from('profiles')
      .select('currency, electricity_rate')
      .eq('user_id', user.id)
      .maybeSingle();

    const currency = profile?.currency || 'USD';
    const rate = profile?.electricity_rate || 0.12;

    let reportData: any = { currency };

    if (reportType === 'comprehensive_analytics') {
      // Fetch energy data
      let energyQuery = supabase
        .from('energy_logs')
        .select('consumption_kwh, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (startDate) energyQuery = energyQuery.gte('logged_at', startDate);
      if (endDate) energyQuery = energyQuery.lte('logged_at', endDate);

      const { data: energyLogs } = await energyQuery;

      // Fetch solar data
      let solarQuery = supabase
        .from('solar_data')
        .select('generation_kwh, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (startDate) solarQuery = solarQuery.gte('logged_at', startDate);
      if (endDate) solarQuery = solarQuery.lte('logged_at', endDate);

      const { data: solarData } = await solarQuery;

      // Fetch appliances
      const { data: appliances } = await supabase
        .from('appliances')
        .select('name, power_rating_w, total_kwh, status')
        .eq('user_id', user.id)
        .order('total_kwh', { ascending: false })
        .limit(10);

      // Fetch CO2 data
      const { data: co2Data } = await supabase
        .from('co2_tracker')
        .select('co2_saved_kg')
        .eq('user_id', user.id);

      // Calculate metrics
      const totalConsumption = (energyLogs || []).reduce((sum, log) => sum + Number(log.consumption_kwh), 0);
      const totalSolar = (solarData || []).reduce((sum, data) => sum + Number(data.generation_kwh), 0);
      const totalCO2 = (co2Data || []).reduce((sum, data) => sum + Number(data.co2_saved_kg), 0);

      const dayCount = Math.max(1, Math.ceil((new Date(endDate || new Date()).getTime() - new Date(startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24)));

      // Calculate peak hour
      const hourlyUsage: Record<number, number> = {};
      (energyLogs || []).forEach(log => {
        const hour = new Date(log.logged_at).getHours();
        hourlyUsage[hour] = (hourlyUsage[hour] || 0) + Number(log.consumption_kwh);
      });
      const peakHour = Object.entries(hourlyUsage).sort(([,a], [,b]) => Number(b) - Number(a))[0]?.[0] || 0;

      reportData = {
        ...reportData,
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now',
        totalConsumption: totalConsumption.toFixed(2),
        avgDailyConsumption: (totalConsumption / dayCount).toFixed(2),
        totalSolar: totalSolar.toFixed(2),
        solarSelfConsumption: totalSolar > 0 ? Math.min(100, (Math.min(totalConsumption, totalSolar) / totalSolar * 100)).toFixed(0) : 0,
        gridExport: Math.max(0, totalSolar - totalConsumption).toFixed(2),
        co2Saved: totalCO2.toFixed(2),
        totalCost: (totalConsumption * rate).toFixed(2),
        peakHour,
        topAppliances: appliances || [],
      };
    } else if (reportType === 'recommendations_report') {
      // Fetch recommendations
      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch forecast
      const { data: consumptionForecast } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('target', 'consumption')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: solarForecast } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('target', 'generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      reportData = {
        ...reportData,
        recommendations: recommendations || [],
        forecast: {
          nextMonthConsumption: consumptionForecast?.value || 0,
          nextMonthSolar: solarForecast?.value || 0,
          nextMonthCost: ((consumptionForecast?.value || 0) * rate).toFixed(2),
          confidence: 'medium',
        },
      };
    }

    const htmlContent = generateHTMLReport(reportData, reportType);
    
    console.log('Report generated successfully:', { 
      reportType, 
      userId: user.id,
      contentLength: htmlContent.length 
    });

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    console.error('Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
