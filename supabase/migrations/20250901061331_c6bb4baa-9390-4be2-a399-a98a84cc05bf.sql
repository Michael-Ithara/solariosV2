-- Create real-time energy data table for storing live simulation data
CREATE TABLE public.real_time_energy_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consumption_kw NUMERIC NOT NULL DEFAULT 0,
  solar_production_kw NUMERIC NOT NULL DEFAULT 0,
  grid_usage_kw NUMERIC NOT NULL DEFAULT 0,
  battery_level_percent INTEGER NOT NULL DEFAULT 0,
  active_devices INTEGER NOT NULL DEFAULT 0,
  total_devices INTEGER NOT NULL DEFAULT 0,
  weather_condition TEXT,
  temperature_celsius NUMERIC,
  cloud_cover_percent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.real_time_energy_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own real-time data" 
ON public.real_time_energy_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own real-time data" 
ON public.real_time_energy_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own real-time data" 
ON public.real_time_energy_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own real-time data" 
ON public.real_time_energy_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance on user_id and timestamp queries
CREATE INDEX idx_real_time_energy_data_user_timestamp 
ON public.real_time_energy_data (user_id, timestamp DESC);

-- Add table to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.real_time_energy_data;