import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AIInsight {
  title: string;
  description: string;
  category: 'usage_pattern' | 'efficiency' | 'cost' | 'solar';
}

export interface AIRecommendation {
  id?: string;
  title: string;
  description: string;
  expected_savings_kwh: number;
  expected_savings_currency: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  created_at?: string;
}

export interface AIForecast {
  nextMonthConsumption: number;
  nextMonthCost: number;
  nextMonthSolar: number;
  confidence: 'high' | 'medium' | 'low';
}

export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [forecast, setForecast] = useState<AIForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch existing recommendations from database
  const fetchStoredRecommendations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  // Fetch forecast data
  const fetchForecast = async () => {
    if (!user) return;

    try {
      const { data: consumptionData } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('target', 'consumption')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: solarData } = await supabase
        .from('ai_forecasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('target', 'generation')
        .order('created_at', { ascending: false })
        .limit(1);

      if (consumptionData?.[0] && solarData?.[0]) {
        const profile = await supabase
          .from('profiles')
          .select('electricity_rate')
          .eq('user_id', user.id)
          .single();

        const rate = profile.data?.electricity_rate || 0.12;
        
        setForecast({
          nextMonthConsumption: consumptionData[0].value,
          nextMonthSolar: solarData[0].value,
          nextMonthCost: consumptionData[0].value * rate,
          confidence: 'medium'
        });
      }
    } catch (err) {
      console.error('Error fetching forecast:', err);
    }
  };

  // Generate new insights using AI
  const generateInsights = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-energy-insights', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.success) {
        setInsights(data.insights || []);
        setRecommendations(data.recommendations || []);
        setForecast(data.forecast || null);
        setLastGeneratedAt(new Date());

        toast({
          title: "AI Analysis Complete",
          description: `Generated ${data.recommendations?.length || 0} personalized recommendations`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate insights');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load stored data on mount and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    fetchStoredRecommendations();
    fetchForecast();

    // Subscribe to real-time updates for energy logs and solar data
    const energyChannel = supabase
      .channel('ai-insights-energy-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'energy_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Auto-regenerate insights if last generation was > 1 hour ago
          if (!lastGeneratedAt || Date.now() - lastGeneratedAt.getTime() > 60 * 60 * 1000) {
            console.log('Energy data updated, auto-generating insights...');
            generateInsights();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solar_data',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          if (!lastGeneratedAt || Date.now() - lastGeneratedAt.getTime() > 60 * 60 * 1000) {
            console.log('Solar data updated, auto-generating insights...');
            generateInsights();
          }
        }
      )
      .subscribe();

    // Subscribe to recommendations updates
    const recChannel = supabase
      .channel('ai-recommendations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_recommendations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchStoredRecommendations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(energyChannel);
      supabase.removeChannel(recChannel);
    };
  }, [user, lastGeneratedAt]);

  return {
    insights,
    recommendations,
    forecast,
    isLoading,
    error,
    lastGeneratedAt,
    generateInsights,
    refetch: () => {
      fetchStoredRecommendations();
      fetchForecast();
    }
  };
}