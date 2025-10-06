-- Add data_source field to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN data_source text NOT NULL DEFAULT 'simulation' 
    CHECK (data_source IN ('demo', 'simulation', 'iot'));
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.data_source IS 'Data source type: demo (preconfigured demo data), simulation (personalized virtual simulation), iot (real IoT devices)';
