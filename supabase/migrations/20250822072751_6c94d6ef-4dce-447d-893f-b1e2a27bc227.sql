-- Create necessary extension for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- Enums
-- =====================
CREATE TYPE public.appliance_status AS ENUM ('on', 'off');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.recommendation_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.forecast_target AS ENUM ('consumption', 'generation', 'savings');

-- =====================
-- Utility function for updated_at
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- Core tables (per-user with RLS)
-- =====================
CREATE TABLE public.appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.appliance_status NOT NULL DEFAULT 'off',
  power_rating_w INTEGER DEFAULT 0 CHECK (power_rating_w >= 0),
  total_kwh NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX appliances_user_id_idx ON public.appliances(user_id);

CREATE TRIGGER update_appliances_updated_at
BEFORE UPDATE ON public.appliances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appliances"
ON public.appliances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appliances"
ON public.appliances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appliances"
ON public.appliances FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appliances"
ON public.appliances FOR DELETE
USING (auth.uid() = user_id);

-- Energy logs
CREATE TABLE public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_id UUID REFERENCES public.appliances(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumption_kwh NUMERIC(12,3) NOT NULL CHECK (consumption_kwh >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX energy_logs_user_id_idx ON public.energy_logs(user_id);
CREATE INDEX energy_logs_logged_at_idx ON public.energy_logs(logged_at);
CREATE INDEX energy_logs_appliance_id_idx ON public.energy_logs(appliance_id);

CREATE TRIGGER update_energy_logs_updated_at
BEFORE UPDATE ON public.energy_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own energy logs"
ON public.energy_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own energy logs"
ON public.energy_logs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    appliance_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.appliances a
      WHERE a.id = energy_logs.appliance_id AND a.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own energy logs"
ON public.energy_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own energy logs"
ON public.energy_logs FOR DELETE
USING (auth.uid() = user_id);

-- Solar data
CREATE TABLE public.solar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_kwh NUMERIC(12,3) NOT NULL CHECK (generation_kwh >= 0),
  irradiance_wm2 NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX solar_data_user_id_idx ON public.solar_data(user_id);
CREATE INDEX solar_data_logged_at_idx ON public.solar_data(logged_at);

CREATE TRIGGER update_solar_data_updated_at
BEFORE UPDATE ON public.solar_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.solar_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own solar data"
ON public.solar_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own solar data"
ON public.solar_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solar data"
ON public.solar_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solar data"
ON public.solar_data FOR DELETE
USING (auth.uid() = user_id);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX alerts_user_id_idx ON public.alerts(user_id);
CREATE INDEX alerts_created_at_idx ON public.alerts(created_at);

CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
ON public.alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
ON public.alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.alerts FOR DELETE
USING (auth.uid() = user_id);

-- =====================
-- Gamification tables
-- =====================
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_points_user_id_idx ON public.user_points(user_id);

CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points row"
ON public.user_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own points"
ON public.user_points FOR DELETE
USING (auth.uid() = user_id);

-- Achievements catalog (global, read-only to everyone)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  max_progress INTEGER NOT NULL DEFAULT 1 CHECK (max_progress >= 1),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX achievements_code_idx ON public.achievements(code);

CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
ON public.achievements FOR SELECT
USING (true);

-- Per-user achievement progress
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX user_achievements_user_id_idx ON public.user_achievements(user_id);
CREATE INDEX user_achievements_achievement_id_idx ON public.user_achievements(achievement_id);

CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievement progress"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement progress"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress"
ON public.user_achievements FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievement progress"
ON public.user_achievements FOR DELETE
USING (auth.uid() = user_id);

-- =====================
-- AI / ML tables
-- =====================
CREATE TABLE public.ai_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target public.forecast_target NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  value NUMERIC(14,4) NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_forecasts_user_id_idx ON public.ai_forecasts(user_id);
CREATE INDEX ai_forecasts_period_idx ON public.ai_forecasts(period_start, period_end);

ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forecasts"
ON public.ai_forecasts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forecasts"
ON public.ai_forecasts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forecasts"
ON public.ai_forecasts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forecasts"
ON public.ai_forecasts FOR DELETE
USING (auth.uid() = user_id);

-- AI recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.recommendation_priority NOT NULL DEFAULT 'medium',
  expected_savings_kwh NUMERIC(12,3),
  expected_savings_currency NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_recommendations_user_id_idx ON public.ai_recommendations(user_id);
CREATE INDEX ai_recommendations_priority_idx ON public.ai_recommendations(priority);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
ON public.ai_recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
ON public.ai_recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
ON public.ai_recommendations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
ON public.ai_recommendations FOR DELETE
USING (auth.uid() = user_id);

-- =====================
-- Demo tables (public read-only)
-- =====================
CREATE TABLE public.demo_appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status public.appliance_status NOT NULL DEFAULT 'off',
  power_rating_w INTEGER DEFAULT 0 CHECK (power_rating_w >= 0),
  total_kwh NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_appliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_appliances" ON public.demo_appliances FOR SELECT USING (true);

CREATE TABLE public.demo_energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appliance_name TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumption_kwh NUMERIC(12,3) NOT NULL CHECK (consumption_kwh >= 0)
);

ALTER TABLE public.demo_energy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_energy_logs" ON public.demo_energy_logs FOR SELECT USING (true);
CREATE INDEX demo_energy_logs_logged_at_idx ON public.demo_energy_logs(logged_at);

CREATE TABLE public.demo_solar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_kwh NUMERIC(12,3) NOT NULL CHECK (generation_kwh >= 0),
  irradiance_wm2 NUMERIC(10,2)
);

ALTER TABLE public.demo_solar_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_solar_data" ON public.demo_solar_data FOR SELECT USING (true);
CREATE INDEX demo_solar_data_logged_at_idx ON public.demo_solar_data(logged_at);

CREATE TABLE public.demo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_alerts" ON public.demo_alerts FOR SELECT USING (true);

CREATE TABLE public.demo_user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_user_points" ON public.demo_user_points FOR SELECT USING (true);

CREATE TABLE public.demo_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  max_progress INTEGER NOT NULL DEFAULT 1 CHECK (max_progress >= 1),
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0)
);

ALTER TABLE public.demo_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read demo_achievements" ON public.demo_achievements FOR SELECT USING (true);

-- =====================
-- Seed demo data
-- =====================
INSERT INTO public.demo_appliances (name, status, power_rating_w, total_kwh) VALUES
  ('HVAC System', 'on', 3500, 124.300),
  ('Refrigerator', 'on', 150, 45.750),
  ('Washing Machine', 'off', 500, 12.100),
  ('Water Heater', 'off', 2000, 88.420);

INSERT INTO public.demo_energy_logs (appliance_name, logged_at, consumption_kwh)
SELECT 'HVAC System', now() - (interval '1 hour' * i), (random() * 3 + 0.5)::numeric(12,3)
FROM generate_series(0, 48) AS s(i);

INSERT INTO public.demo_energy_logs (appliance_name, logged_at, consumption_kwh)
SELECT 'Refrigerator', now() - (interval '1 hour' * i), (random() * 0.2 + 0.05)::numeric(12,3)
FROM generate_series(0, 48) AS s(i);

INSERT INTO public.demo_solar_data (logged_at, generation_kwh, irradiance_wm2)
SELECT now() - (interval '1 hour' * i), GREATEST(0, (5 * sin((12 - i % 24) / 24.0 * 3.14159)))::numeric(12,3), (random() * 800 + 200)::numeric(10,2)
FROM generate_series(0, 48) AS s(i);

INSERT INTO public.demo_alerts (title, message, severity, created_at) VALUES
  ('High Usage Detected', 'Your HVAC usage spiked by 40% compared to yesterday.', 'warning', now() - interval '2 hours'),
  ('Solar Peak', 'Solar generation peaked at 3.2 kWh/h at noon.', 'info', now() - interval '4 hours'),
  ('Appliance Left On', 'Washing Machine appears to be running longer than usual.', 'warning', now() - interval '1 day');

INSERT INTO public.demo_user_points (points, level, xp, updated_at) VALUES
  (375, 4, 20, now());

INSERT INTO public.demo_achievements (code, title, description, category, progress, max_progress, unlocked, unlocked_at, points) VALUES
  ('first_day', 'First Day Online', 'Monitor your energy for the first day', 'consistency', 1, 1, TRUE, now() - interval '1 day', 50),
  ('solar_hero', 'Solar Hero', 'Generate 100kWh from solar panels', 'solar', 42, 100, FALSE, NULL, 200),
  ('energy_saver', 'Energy Saver', 'Reduce consumption by 20% for a week', 'energy_saving', 15, 20, FALSE, NULL, 150),
  ('efficiency_master', 'Efficiency Master', 'Maintain 90%+ efficiency for 30 days', 'efficiency', 12, 30, FALSE, NULL, 300);
