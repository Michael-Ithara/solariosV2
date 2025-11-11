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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      :root {
        --primary: #16a34a;
        --primary-dark: #15803d;
        --secondary: #0284c7;
        --accent: #f59e0b;
        --bg-light: #f8fafc;
        --bg-white: #ffffff;
        --text-dark: #0f172a;
        --text-medium: #475569;
        --text-light: #64748b;
        --border: #e2e8f0;
        --border-dark: #cbd5e1;
        --shadow: 0 1px 3px rgba(0,0,0,0.1);
        --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
        --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: var(--text-dark);
        line-height: 1.6;
        background: var(--bg-white);
        max-width: 1200px;
        margin: 0 auto;
      }
      
      /* Cover Page */
      .cover-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        color: white;
        padding: 60px 40px;
        page-break-after: always;
      }
      
      .logo {
        width: 80px;
        height: 80px;
        background: white;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30px;
        box-shadow: var(--shadow-lg);
      }
      
      .logo-text {
        font-size: 36px;
        font-weight: 700;
        color: var(--primary);
      }
      
      .cover-page h1 {
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 20px;
        line-height: 1.2;
      }
      
      .cover-page .subtitle {
        font-size: 20px;
        opacity: 0.95;
        margin-bottom: 40px;
      }
      
      .report-meta {
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        padding: 30px 50px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.2);
        margin-top: 40px;
      }
      
      .report-meta p {
        font-size: 16px;
        margin: 8px 0;
        opacity: 0.95;
      }
      
      .report-meta strong {
        font-weight: 600;
      }
      
      /* Header & Footer for Content Pages */
      .page-header {
        padding: 30px 40px 20px;
        border-bottom: 3px solid var(--primary);
        margin-bottom: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .page-header .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .page-header .brand .icon {
        width: 40px;
        height: 40px;
        background: var(--primary);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 18px;
      }
      
      .page-header .brand-name {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-dark);
      }
      
      .page-header .report-id {
        text-align: right;
        font-size: 13px;
        color: var(--text-light);
      }
      
      .content-wrapper {
        padding: 0 40px 40px;
      }
      
      /* Executive Summary */
      .executive-summary {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid var(--primary);
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 50px;
        box-shadow: var(--shadow-md);
      }
      
      .executive-summary h2 {
        color: var(--primary-dark);
        font-size: 26px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .executive-summary h2::before {
        content: "★";
        font-size: 28px;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .summary-item {
        text-align: center;
        padding: 15px;
      }
      
      .summary-item .label {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-medium);
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .summary-item .value {
        font-size: 32px;
        font-weight: 700;
        color: var(--primary-dark);
      }
      
      .summary-item .unit {
        font-size: 16px;
        color: var(--text-medium);
        margin-left: 4px;
      }
      
      /* Section Styling */
      .section {
        margin-bottom: 50px;
        page-break-inside: avoid;
      }
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--border-dark);
      }
      
      .section-number {
        width: 40px;
        height: 40px;
        background: var(--primary);
        color: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
      }
      
      .section h2 {
        color: var(--text-dark);
        font-size: 28px;
        font-weight: 700;
        margin: 0;
      }
      
      /* Metric Cards */
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 20px;
        margin: 25px 0;
      }
      
      .metric-card {
        background: var(--bg-white);
        border: 2px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        transition: all 0.3s ease;
        box-shadow: var(--shadow);
      }
      
      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      
      .metric-card.primary {
        border-left: 4px solid var(--primary);
        background: linear-gradient(to right, #f0fdf4 0%, var(--bg-white) 20%);
      }
      
      .metric-card.secondary {
        border-left: 4px solid var(--secondary);
        background: linear-gradient(to right, #f0f9ff 0%, var(--bg-white) 20%);
      }
      
      .metric-card.accent {
        border-left: 4px solid var(--accent);
        background: linear-gradient(to right, #fffbeb 0%, var(--bg-white) 20%);
      }
      
      .metric-card h3 {
        color: var(--text-medium);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 12px;
        font-weight: 600;
      }
      
      .metric-card .value {
        color: var(--text-dark);
        font-size: 36px;
        font-weight: 700;
        line-height: 1;
      }
      
      .metric-card .unit {
        color: var(--text-light);
        font-size: 16px;
        font-weight: 500;
        margin-left: 4px;
      }
      
      .metric-card .trend {
        margin-top: 12px;
        font-size: 14px;
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
      }
      
      .trend.up {
        background: #dcfce7;
        color: #166534;
      }
      
      .trend.down {
        background: #fee2e2;
        color: #991b1b;
      }
      
      /* Tables */
      .table-container {
        background: var(--bg-white);
        border: 2px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        margin: 25px 0;
        box-shadow: var(--shadow);
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      thead {
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      }
      
      th {
        padding: 16px;
        text-align: left;
        color: white;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background 0.2s ease;
      }
      
      tbody tr:nth-child(even) {
        background: var(--bg-light);
      }
      
      tbody tr:hover {
        background: #f0fdf4;
      }
      
      tbody tr:last-child {
        border-bottom: none;
      }
      
      td {
        padding: 16px;
        color: var(--text-dark);
        font-size: 15px;
      }
      
      td strong {
        color: var(--text-dark);
        font-weight: 600;
      }
      
      /* Recommendation Cards */
      .recommendation {
        background: var(--bg-white);
        border-radius: 12px;
        padding: 24px;
        margin: 16px 0;
        border-left: 5px solid var(--accent);
        box-shadow: var(--shadow-md);
        transition: all 0.3s ease;
      }
      
      .recommendation:hover {
        transform: translateX(4px);
        box-shadow: var(--shadow-lg);
      }
      
      .recommendation.priority-high {
        border-left-color: #dc2626;
        background: linear-gradient(to right, #fef2f2 0%, var(--bg-white) 30%);
      }
      
      .recommendation.priority-medium {
        border-left-color: #f59e0b;
        background: linear-gradient(to right, #fffbeb 0%, var(--bg-white) 30%);
      }
      
      .recommendation.priority-low {
        border-left-color: #16a34a;
        background: linear-gradient(to right, #f0fdf4 0%, var(--bg-white) 30%);
      }
      
      .recommendation-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 12px;
      }
      
      .recommendation h4 {
        color: var(--text-dark);
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .priority-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .priority-badge.high {
        background: #fee2e2;
        color: #991b1b;
      }
      
      .priority-badge.medium {
        background: #fef3c7;
        color: #92400e;
      }
      
      .priority-badge.low {
        background: #dcfce7;
        color: #166534;
      }
      
      .recommendation p {
        color: var(--text-medium);
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 16px;
      }
      
      .savings-highlight {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        padding: 16px;
        border-radius: 8px;
        margin-top: 16px;
        border: 1px solid var(--primary);
      }
      
      .savings-highlight strong {
        color: var(--primary-dark);
        font-size: 16px;
      }
      
      /* Call-out Box */
      .callout {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 2px solid var(--secondary);
        border-radius: 12px;
        padding: 24px;
        margin: 25px 0;
        box-shadow: var(--shadow);
      }
      
      .callout-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .callout-icon {
        width: 32px;
        height: 32px;
        background: var(--secondary);
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
      }
      
      .callout h3 {
        color: var(--secondary);
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
      
      .callout p {
        color: var(--text-medium);
        margin: 8px 0 0 0;
        line-height: 1.6;
      }
      
      /* Footer */
      .page-footer {
        margin-top: 80px;
        padding: 30px 40px;
        border-top: 3px solid var(--primary);
        background: var(--bg-light);
      }
      
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .footer-brand {
        font-weight: 600;
        color: var(--text-dark);
      }
      
      .footer-info {
        text-align: right;
        font-size: 13px;
        color: var(--text-light);
      }
      
      .footer-info p {
        margin: 4px 0;
      }
      
      .confidential {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        font-size: 12px;
        color: var(--text-light);
        font-style: italic;
      }
      
      /* Print Styles */
      @media print {
        body { max-width: 100%; }
        .section { page-break-inside: avoid; }
        .cover-page { page-break-after: always; }
        .metric-card:hover, .recommendation:hover { transform: none; }
      }
    </style>
  `;

  const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const generatedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let content = '';

  if (reportType === 'comprehensive_analytics') {
    content = `
      <div class="cover-page">
        <div class="logo">
          <div class="logo-text">⚡</div>
        </div>
        <h1>Energy Analytics Report</h1>
        <p class="subtitle">Comprehensive Energy Consumption & Solar Generation Analysis</p>
        <div class="report-meta">
          <p><strong>Report ID:</strong> ${reportId}</p>
          <p><strong>Generated:</strong> ${generatedDate} at ${generatedTime}</p>
          <p><strong>Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Report Type:</strong> Comprehensive Analytics</p>
        </div>
      </div>

      <div class="page-header">
        <div class="brand">
          <div class="icon">⚡</div>
          <div class="brand-name">SolarOS Energy</div>
        </div>
        <div class="report-id">
          <p><strong>${reportId}</strong></p>
          <p>${generatedDate}</p>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="executive-summary">
          <h2>Executive Summary</h2>
          <p>This report provides a comprehensive analysis of your energy consumption and solar generation for the period ${data.startDate} to ${data.endDate}. Key highlights include total consumption of ${data.totalConsumption} kWh, solar generation of ${data.totalSolar} kWh, and a total cost savings of ${data.currency}${data.totalCost}.</p>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Total Energy Used</div>
              <div class="value">${data.totalConsumption}<span class="unit">kWh</span></div>
            </div>
            <div class="summary-item">
              <div class="label">Solar Generated</div>
              <div class="value">${data.totalSolar}<span class="unit">kWh</span></div>
            </div>
            <div class="summary-item">
              <div class="label">CO₂ Reduced</div>
              <div class="value">${data.co2Saved}<span class="unit">kg</span></div>
            </div>
            <div class="summary-item">
              <div class="label">Total Cost</div>
              <div class="value">${data.currency}${data.totalCost}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div class="section-number">1</div>
            <h2>Energy Consumption Analysis</h2>
          </div>
          <div class="metric-grid">
            <div class="metric-card primary">
              <h3>Total Consumption</h3>
              <div class="value">${data.totalConsumption}<span class="unit">kWh</span></div>
            </div>
            <div class="metric-card primary">
              <h3>Average Daily Usage</h3>
              <div class="value">${data.avgDailyConsumption}<span class="unit">kWh/day</span></div>
            </div>
            <div class="metric-card accent">
              <h3>Peak Usage Hour</h3>
              <div class="value">${data.peakHour}:00<span class="unit">hrs</span></div>
            </div>
            <div class="metric-card accent">
              <h3>Total Energy Cost</h3>
              <div class="value">${data.currency}${data.totalCost}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div class="section-number">2</div>
            <h2>Solar Generation Performance</h2>
          </div>
          <div class="metric-grid">
            <div class="metric-card secondary">
              <h3>Total Solar Generation</h3>
              <div class="value">${data.totalSolar}<span class="unit">kWh</span></div>
            </div>
            <div class="metric-card secondary">
              <h3>Self-Consumption Rate</h3>
              <div class="value">${data.solarSelfConsumption}<span class="unit">%</span></div>
            </div>
            <div class="metric-card secondary">
              <h3>Grid Export</h3>
              <div class="value">${data.gridExport}<span class="unit">kWh</span></div>
            </div>
            <div class="metric-card primary">
              <h3>CO₂ Emissions Saved</h3>
              <div class="value">${data.co2Saved}<span class="unit">kg</span></div>
            </div>
          </div>
          
          <div class="callout">
            <div class="callout-header">
              <div class="callout-icon">💡</div>
              <h3>Environmental Impact</h3>
            </div>
            <p>Your solar system has offset <strong>${data.co2Saved} kg of CO₂</strong> emissions during this period, equivalent to planting approximately ${Math.round(Number(data.co2Saved) / 21)} trees. By self-consuming ${data.solarSelfConsumption}% of your solar generation, you're maximizing both environmental and financial benefits.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div class="section-number">3</div>
            <h2>Appliance Energy Breakdown</h2>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Appliance Name</th>
                  <th>Power Rating</th>
                  <th>Total Consumption</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.topAppliances?.map((app: any, index: number) => `
                  <tr>
                    <td><strong>${index + 1}. ${app.name}</strong></td>
                    <td>${app.power_rating_w}W</td>
                    <td><strong>${Number(app.total_kwh).toFixed(2)} kWh</strong></td>
                    <td><span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${app.status === 'on' ? '#dcfce7' : '#f1f5f9'}; color: ${app.status === 'on' ? '#166534' : '#475569'};">${app.status.toUpperCase()}</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-light);">No appliance data available for this period</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (reportType === 'recommendations_report') {
    const totalSavings = (data.recommendations || []).reduce((sum: number, rec: any) => sum + (Number(rec.expected_savings_kwh) || 0), 0);
    const totalCostSavings = (data.recommendations || []).reduce((sum: number, rec: any) => sum + (Number(rec.expected_savings_currency) || 0), 0);
    
    content = `
      <div class="cover-page">
        <div class="logo">
          <div class="logo-text">🤖</div>
        </div>
        <h1>AI Recommendations Report</h1>
        <p class="subtitle">Personalized Energy Optimization & Forecasting</p>
        <div class="report-meta">
          <p><strong>Report ID:</strong> ${reportId}</p>
          <p><strong>Generated:</strong> ${generatedDate} at ${generatedTime}</p>
          <p><strong>Report Type:</strong> AI-Powered Recommendations</p>
          <p><strong>Recommendations:</strong> ${data.recommendations?.length || 0} actionable insights</p>
        </div>
      </div>

      <div class="page-header">
        <div class="brand">
          <div class="icon">🤖</div>
          <div class="brand-name">SolarOS AI Insights</div>
        </div>
        <div class="report-id">
          <p><strong>${reportId}</strong></p>
          <p>${generatedDate}</p>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="executive-summary">
          <h2>Executive Summary</h2>
          <p>Our AI analysis has identified ${data.recommendations?.length || 0} personalized recommendations to optimize your energy consumption. By implementing these suggestions, you could save up to <strong>${totalSavings.toFixed(1)} kWh</strong> per month, reducing your energy costs by approximately <strong>${data.currency}${totalCostSavings.toFixed(2)}</strong> monthly.</p>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Recommendations</div>
              <div class="value">${data.recommendations?.length || 0}</div>
            </div>
            <div class="summary-item">
              <div class="label">Potential Savings</div>
              <div class="value">${totalSavings.toFixed(1)}<span class="unit">kWh/mo</span></div>
            </div>
            <div class="summary-item">
              <div class="label">Cost Savings</div>
              <div class="value">${data.currency}${totalCostSavings.toFixed(2)}<span class="unit">/mo</span></div>
            </div>
            <div class="summary-item">
              <div class="label">Forecast Accuracy</div>
              <div class="value">${data.forecast?.confidence || 'Medium'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div class="section-number">1</div>
            <h2>Personalized Recommendations</h2>
          </div>
          ${data.recommendations?.length > 0 ? data.recommendations.map((rec: any, index: number) => `
            <div class="recommendation priority-${rec.priority}">
              <div class="recommendation-header">
                <h4>${index + 1}. ${rec.title}</h4>
                <span class="priority-badge ${rec.priority}">${rec.priority} Priority</span>
              </div>
              <p>${rec.description}</p>
              <div class="savings-highlight">
                <strong>💰 Expected Savings:</strong> ${rec.expected_savings_kwh} kWh/month (${data.currency}${rec.expected_savings_currency}/month)
              </div>
            </div>
          `).join('') : '<div class="callout"><div class="callout-header"><div class="callout-icon">ℹ️</div><h3>No Recommendations</h3></div><p>No AI recommendations are available at this time. Continue monitoring your energy usage to receive personalized insights.</p></div>'}
        </div>

        <div class="section">
          <div class="section-header">
            <div class="section-number">2</div>
            <h2>Energy Forecast</h2>
          </div>
          <div class="metric-grid">
            <div class="metric-card primary">
              <h3>Forecasted Consumption</h3>
              <div class="value">${data.forecast?.nextMonthConsumption || 0}<span class="unit">kWh</span></div>
              <div class="trend up">Next Month</div>
            </div>
            <div class="metric-card secondary">
              <h3>Forecasted Solar</h3>
              <div class="value">${data.forecast?.nextMonthSolar || 0}<span class="unit">kWh</span></div>
              <div class="trend up">Next Month</div>
            </div>
            <div class="metric-card accent">
              <h3>Estimated Cost</h3>
              <div class="value">${data.currency}${data.forecast?.nextMonthCost || 0}</div>
              <div class="trend up">Next Month</div>
            </div>
            <div class="metric-card">
              <h3>Forecast Confidence</h3>
              <div class="value" style="font-size: 24px; text-transform: capitalize;">${data.forecast?.confidence || 'Medium'}</div>
            </div>
          </div>
          
          <div class="callout">
            <div class="callout-header">
              <div class="callout-icon">📊</div>
              <h3>Forecast Methodology</h3>
            </div>
            <p>Our AI forecasting model analyzes historical consumption patterns, seasonal trends, weather data, and solar generation to predict future energy usage. The <strong>${data.forecast?.confidence || 'medium'} confidence level</strong> indicates the reliability of these predictions based on available data.</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${reportType === 'comprehensive_analytics' ? 'Energy Analytics Report' : 'AI Recommendations Report'} - ${reportId}</title>
      ${styles}
    </head>
    <body>
      ${content}
      <div class="page-footer">
        <div class="footer-content">
          <div class="footer-brand">
            ⚡ SolarOS Energy Management System
          </div>
          <div class="footer-info">
            <p><strong>Report ID:</strong> ${reportId}</p>
            <p>Generated: ${generatedDate} at ${generatedTime}</p>
            <p>Page 1 of 1</p>
          </div>
        </div>
        <div class="confidential">
          This report contains confidential information. Generated automatically by SolarOS AI • For support, contact your energy management team
        </div>
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

      // Fetch appliances with calculated consumption from energy logs
      const { data: appliances } = await supabase
        .from('appliances')
        .select('id, name, power_rating_w, total_kwh, status')
        .eq('user_id', user.id)
        .limit(50);

      // Calculate actual consumption per appliance from energy_logs
      const appliancesWithConsumption = await Promise.all((appliances || []).map(async (app) => {
        let consumptionQuery = supabase
          .from('energy_logs')
          .select('consumption_kwh')
          .eq('user_id', user.id)
          .eq('appliance_id', app.id);

        if (startDate) consumptionQuery = consumptionQuery.gte('logged_at', startDate);
        if (endDate) consumptionQuery = consumptionQuery.lte('logged_at', endDate);

        const { data: logs } = await consumptionQuery;
        const calculatedConsumption = (logs || []).reduce((sum, log) => sum + Number(log.consumption_kwh), 0);
        
        // Use calculated consumption if available, otherwise use total_kwh
        return {
          ...app,
          total_kwh: calculatedConsumption > 0 ? calculatedConsumption : Number(app.total_kwh || 0)
        };
      }));

      const topAppliances = appliancesWithConsumption
        .sort((a, b) => b.total_kwh - a.total_kwh)
        .slice(0, 10);

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
        topAppliances: topAppliances || [],
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
