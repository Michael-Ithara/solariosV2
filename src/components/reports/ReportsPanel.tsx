import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function ReportsPanel() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<string>('energy_logs');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const isAdmin = role === 'admin';

  const csvReportTypes = [
    { value: 'energy_logs', label: 'Energy Consumption Logs', requiresDate: true },
    { value: 'solar_data', label: 'Solar Generation Data', requiresDate: true },
    { value: 'recommendations', label: 'AI Recommendations', requiresDate: false },
    { value: 'appliances', label: 'Appliances List', requiresDate: false },
    { value: 'co2_tracker', label: 'CO₂ Savings Tracker', requiresDate: true },
    ...(isAdmin ? [{ value: 'all_users_summary', label: 'All Users Summary (Admin)', requiresDate: false }] : []),
  ];

  const pdfReportTypes = [
    { value: 'comprehensive_analytics', label: 'Comprehensive Analytics Report' },
    { value: 'recommendations_report', label: 'AI Recommendations Report' },
  ];

  const handleGenerateCSV = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-csv-report', {
        body: {
          reportType,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });

      if (error) throw error;

      // Convert the response to a blob
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Report Generated',
        description: 'Your CSV report has been downloaded.',
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate CSV report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePDF = async (pdfType: string) => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {
          reportType: pdfType,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No HTML content received from server');
      }

      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      container.innerHTML = data;
      document.body.appendChild(container);

      toast({
        title: 'Generating PDF',
        description: 'Please wait while we create your PDF report...',
      });

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate PDF using html2canvas and jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const coverPage = container.querySelector('.cover-page');
      const contentWrapper = container.querySelector('.content-wrapper');
      
      // Render cover page
      if (coverPage) {
        const canvas = await html2canvas(coverPage as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      }

      // Render content on new page
      if (contentWrapper) {
        pdf.addPage();
        const canvas = await html2canvas(contentWrapper as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      // Clean up
      document.body.removeChild(container);

      // Generate filename
      const reportTypeLabel = pdfType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `${reportTypeLabel}_${dateStr}.pdf`;

      // Download the PDF
      pdf.save(filename);

      toast({
        title: 'Report Generated',
        description: 'Your PDF report has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Reports</CardTitle>
          <CardDescription>Download detailed data exports in CSV format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {csvReportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PP') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PP') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Button onClick={handleGenerateCSV} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download CSV Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDF Reports</CardTitle>
          <CardDescription>Generate professional, data-accurate PDF reports for presentation and analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {pdfReportTypes.map((type) => (
              <Button
                key={type.value}
                onClick={() => handleGeneratePDF(type.value)}
                disabled={isGenerating}
                variant="outline"
                className="h-auto flex-col items-start p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">{type.label}</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {type.value === 'comprehensive_analytics'
                    ? 'Complete energy usage analysis with actual data and metrics'
                    : 'AI-powered recommendations and forecasts'}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
