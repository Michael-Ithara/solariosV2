-- Create CO₂ tracker table
CREATE TABLE IF NOT EXISTS public.co2_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  solar_kwh NUMERIC NOT NULL DEFAULT 0,
  grid_kwh NUMERIC NOT NULL DEFAULT 0,
  co2_saved_kg NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on co2_tracker
ALTER TABLE public.co2_tracker ENABLE ROW LEVEL SECURITY;

-- RLS policies for co2_tracker
CREATE POLICY "Users can view their own CO₂ data"
  ON public.co2_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CO₂ data"
  ON public.co2_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CO₂ data"
  ON public.co2_tracker FOR DELETE
  USING (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO public.achievements (code, title, description, category, max_progress, points) VALUES
  ('eco_starter', 'Eco Starter', 'Reduce grid usage by 10%', 'energy_saving', 10, 50),
  ('solar_hero', 'Solar Hero', 'Achieve 80% solar reliance', 'solar', 80, 200),
  ('power_producer', 'Power Producer', 'Generate 10+ kWh solar in a day', 'solar', 10, 100),
  ('first_day', 'First Day Online', 'Monitor your energy for the first day', 'consistency', 1, 50),
  ('week_warrior', 'Week Warrior', 'Check your dashboard 7 days in a row', 'consistency', 7, 100),
  ('efficiency_master', 'Efficiency Master', 'Maintain 90%+ efficiency for 30 days', 'efficiency', 30, 300)
ON CONFLICT (code) DO NOTHING;