-- Add missing onboarding persistence columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS smart_meter_type TEXT CHECK (smart_meter_type IN ('demo', 'real')),
ADD COLUMN IF NOT EXISTS smart_meter_brand TEXT,
ADD COLUMN IF NOT EXISTS smart_meter_model TEXT,
ADD COLUMN IF NOT EXISTS smart_meter_connection_method TEXT,
ADD COLUMN IF NOT EXISTS has_solar_system BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS solar_panel_count INTEGER,
ADD COLUMN IF NOT EXISTS solar_inverter_brand TEXT,
ADD COLUMN IF NOT EXISTS solar_installation_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.country IS 'User selected country from onboarding';
COMMENT ON COLUMN public.profiles.city IS 'User selected city from onboarding';
COMMENT ON COLUMN public.profiles.timezone IS 'User selected timezone from onboarding';
COMMENT ON COLUMN public.profiles.smart_meter_type IS 'Type of smart meter setup: demo or real';
COMMENT ON COLUMN public.profiles.smart_meter_brand IS 'Brand of smart meter if real';
COMMENT ON COLUMN public.profiles.smart_meter_connection_method IS 'Connection method for real smart meter';
COMMENT ON COLUMN public.profiles.has_solar_system IS 'Whether user has solar panels installed';
COMMENT ON COLUMN public.profiles.solar_panel_count IS 'Number of solar panels installed';
COMMENT ON COLUMN public.profiles.solar_inverter_brand IS 'Brand of solar inverter';
COMMENT ON COLUMN public.profiles.solar_installation_date IS 'Date when solar system was installed';