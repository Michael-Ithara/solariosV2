import { Sun, Cloud, CloudRain, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock weather data
const weatherData = {
  current: {
    temperature: 24,
    condition: "sunny",
    humidity: 45,
    windSpeed: 12,
    uvIndex: 6
  },
  forecast: [
    { hour: "Now", temp: 24, condition: "sunny", solarPotential: 95 },
    { hour: "2PM", temp: 26, condition: "sunny", solarPotential: 100 },
    { hour: "4PM", temp: 25, condition: "partly-cloudy", solarPotential: 75 },
    { hour: "6PM", temp: 22, condition: "cloudy", solarPotential: 40 },
  ]
};

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
            <div className="text-2xl font-bold">{weatherData.current.temperature}°C</div>
            <p className="text-sm text-muted-foreground capitalize">
              {weatherData.current.condition.replace("-", " ")}
            </p>
          </div>
          <WeatherIcon condition={weatherData.current.condition} className="h-12 w-12 text-energy-solar" />
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{weatherData.current.humidity}%</div>
            <div className="text-muted-foreground">Humidity</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{weatherData.current.windSpeed}km/h</div>
            <div className="text-muted-foreground">Wind</div>
          </div>
          <div className="text-center">
            <div className="font-medium">UV {weatherData.current.uvIndex}</div>
            <div className="text-muted-foreground">Index</div>
          </div>
        </div>

        {/* Hourly Solar Forecast */}
        <div>
          <h4 className="text-sm font-medium mb-3">Solar Production Forecast</h4>
          <div className="grid grid-cols-4 gap-2">
            {weatherData.forecast.map((hour, index) => (
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