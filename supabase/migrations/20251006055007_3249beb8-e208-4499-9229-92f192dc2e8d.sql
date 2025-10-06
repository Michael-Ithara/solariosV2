-- Create grid_prices table for dynamic electricity pricing
CREATE TABLE IF NOT EXISTS public.grid_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price_per_kwh NUMERIC NOT NULL DEFAULT 0,
  price_tier TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on grid_prices
ALTER TABLE public.grid_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies for grid_prices
CREATE POLICY "Users can view their own grid prices"
  ON public.grid_prices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grid prices"
  ON public.grid_prices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grid prices"
  ON public.grid_prices FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for weather_data to allow user inserts
CREATE POLICY "Users can insert weather data"
  ON public.weather_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update weather data"
  ON public.weather_data FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete old weather data"
  ON public.weather_data FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_grid_prices_user_timestamp ON public.grid_prices(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON public.weather_data(timestamp DESC);