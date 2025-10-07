import { Sun, Cloud, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

const WeatherIcon = ({ condition, className }: { condition: string, className?: string }) => {
  switch (condition) {
    case "sunny":
      return <Sun className={className} />;
    case "partly-cloudy":
      return <Cloud className={className} />;
    case "cloudy":
      return <Cloud className={className} />;
    case "rainy":
      return <CloudRain className={className} />;
    default:
      return <Sun className={className} />;
  }
};

export function WeatherWidget() {
  const { profile } = useProfile();
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const city = profile?.display_name || "";
  const country = profile?.currency === 'EUR' ? 'DE' : profile?.currency || 'US';

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // Simple public weather API (replace with your key/provider as needed)
        const q = encodeURIComponent(city ? city : country);
        const res = await fetch(`https://wttr.in/${q}?format=j1`);
        const json = await res.json();
        const current = json.current_condition?.[0];
        const hourly = json.weather?.[0]?.hourly || [];
        const mapCond = (code: number) => {
          if (code === 113) return 'sunny';
          if ([116,119].includes(code)) return 'partly-cloudy';
          if ([122,143,176].includes(code)) return 'cloudy';
          return 'sunny';
        };
        const mapped = {
          current: {
            temperature: parseFloat(current?.temp_C ?? '22'),
            condition: mapCond(parseInt(current?.weatherCode ?? '113')),
            humidity: parseInt(current?.humidity ?? '50'),
            windSpeed: parseInt(current?.windspeedKmph ?? '10'),
            uvIndex: parseInt(current?.uvIndex ?? '5')
          },
          forecast: hourly.slice(0,4).map((h: any, idx: number) => ({
            hour: idx === 0 ? 'Now' : `${Math.round((parseInt(h.time)||0)/100).toString().padStart(2,'0')}:00`,
            temp: parseFloat(h.tempC ?? '22'),
            condition: mapCond(parseInt(h.weatherCode ?? '113')),
            solarPotential: Math.max(0, 100 - parseInt(h.cloudcover ?? '50'))
          }))
        };
        setWeatherData(mapped);
      } catch (e) {
        console.error('Weather fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [city, country]);
  return (
    <Card className="border-energy-solar/20 bg-gradient-to-br from-energy-solar/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-5 w-5 text-energy-solar" />
          Solar Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Conditions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{weatherData?.current?.temperature ?? '...'}°C</div>
            <p className="text-sm text-muted-foreground capitalize">
              {weatherData?.current?.condition?.replace("-", " ") ?? '...' }
            </p>
          </div>
          <WeatherIcon condition={weatherData?.current?.condition || 'sunny'} className="h-12 w-12 text-energy-solar" />
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{weatherData?.current?.humidity ?? '...'}%</div>
            <div className="text-muted-foreground">Humidity</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{weatherData?.current?.windSpeed ?? '...'}km/h</div>
            <div className="text-muted-foreground">Wind</div>
          </div>
          <div className="text-center">
            <div className="font-medium">UV {weatherData?.current?.uvIndex ?? '...'}</div>
            <div className="text-muted-foreground">Index</div>
          </div>
        </div>

        {/* Hourly Solar Forecast */}
        <div>
          <h4 className="text-sm font-medium mb-3">Solar Production Forecast</h4>
          <div className="grid grid-cols-4 gap-2">
            {(weatherData?.forecast || []).map((hour: any, index: number) => (
              <div key={index} className="text-center p-2 rounded-lg bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">{hour.hour}</div>
                <WeatherIcon condition={hour.condition} className="h-6 w-6 mx-auto mb-2 text-energy-solar" />
                <div className="text-xs font-medium">{hour.temp}°</div>
                <div className="text-xs text-energy-solar font-medium">
                  {hour.solarPotential}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}