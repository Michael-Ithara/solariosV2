import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HistoricalDataBackfill() {
  const { user } = useAuth();
  const [daysBack, setDaysBack] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBackfill = async () => {
    if (!user) {
      toast.error("You must be logged in to backfill data");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('backfill-historical-data', {
        body: {
          user_id: user.id,
          days_back: daysBack
        }
      });

      if (error) throw error;

      setResult(data);
      toast.success(`Successfully backfilled ${daysBack} days of historical data!`);
    } catch (error: any) {
      console.error('Backfill error:', error);
      toast.error(error.message || 'Failed to backfill historical data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Data Backfill</CardTitle>
        <CardDescription>
          Generate realistic historical energy data to improve AI forecasting and visualizations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="days">Days of History to Generate</Label>
          <Input
            id="days"
            type="number"
            min={7}
            max={365}
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Recommended: 30-90 days for meaningful forecasting
          </p>
        </div>

        <Button 
          onClick={handleBackfill} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Historical Data...
            </>
          ) : (
            'Generate Historical Data'
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Backfill Results:</h4>
            <ul className="text-sm space-y-1">
              <li>Energy Logs: {result.records_created?.energy_logs || 0}</li>
              <li>Solar Data: {result.records_created?.solar_data || 0}</li>
              <li>Weather Data: {result.records_created?.weather_data || 0}</li>
              <li>Grid Prices: {result.records_created?.grid_prices || 0}</li>
              <li>CO₂ Tracking: {result.records_created?.co2_data || 0}</li>
              <li>Raw Energy Data: {result.records_created?.raw_energy_data || 0}</li>
              <li>ML Features: {result.records_created?.processed_features || 0}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
