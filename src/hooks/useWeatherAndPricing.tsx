import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from './useCurrency';

interface WeatherData {
  temperature: number;
  cloudCover: number;
  weatherCondition: string;
  irradiance: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
}

interface GridPricing {
  price: number;
  tier: string;
  timestamp: Date;
}

export function useWeatherAndPricing() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [gridPrice, setGridPrice] = useState<GridPricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch latest weather data
        const { data: weatherData } = await supabase
          .from('weather_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (weatherData) {
          setWeather({
            temperature: Number(weatherData.temperature_celsius || 0),
            cloudCover: weatherData.cloud_cover_percent || 0,
            weatherCondition: weatherData.weather_condition || 'sunny',
            irradiance: Number(weatherData.solar_irradiance_wm2 || 0),
            humidity: weatherData.humidity_percent || 0,
            windSpeed: Number(weatherData.wind_speed_kmh || 0),
            uvIndex: weatherData.uv_index || 0
          });
        }

        // Fetch latest grid pricing
        const { data: pricingData } = await supabase
          .from('grid_prices')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (pricingData) {
          setGridPrice({
            price: Number(pricingData.price_per_kwh),
            tier: pricingData.price_tier,
            timestamp: new Date(pricingData.timestamp)
          });
        }
      } catch (error) {
        console.error('Error fetching weather and pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const weatherChannel = supabase
      .channel('weather-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'weather_data'
        },
        (payload) => {
          const newData = payload.new as any;
          setWeather({
            temperature: Number(newData.temperature_celsius || 0),
            cloudCover: newData.cloud_cover_percent || 0,
            weatherCondition: newData.weather_condition || 'sunny',
            irradiance: Number(newData.solar_irradiance_wm2 || 0),
            humidity: newData.humidity_percent || 0,
            windSpeed: Number(newData.wind_speed_kmh || 0),
            uvIndex: newData.uv_index || 0
          });
        }
      )
      .subscribe();

    const pricingChannel = supabase
      .channel('pricing-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grid_prices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          setGridPrice({
            price: Number(newData.price_per_kwh),
            tier: newData.price_tier,
            timestamp: new Date(newData.timestamp)
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(weatherChannel);
      supabase.removeChannel(pricingChannel);
    };
  }, [user]);

  return {
    weather,
    gridPrice,
    loading,
    formatPrice: (price: number) => formatCurrency(price)
  };
}
