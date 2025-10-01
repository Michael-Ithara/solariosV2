-- Smart Meter Phase 2 Schema
-- Entities: smart_meters, inverters, circuits, devices (device_instances)

-- Smart meters table
CREATE TABLE IF NOT EXISTS public.smart_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own smart_meters" ON public.smart_meters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own smart_meters" ON public.smart_meters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own smart_meters" ON public.smart_meters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own smart_meters" ON public.smart_meters FOR DELETE USING (auth.uid() = user_id);

-- Inverters linked to smart meters (optional if solar present)
CREATE TABLE IF NOT EXISTS public.inverters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.smart_meters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  capacity_kw NUMERIC(8,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inverters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their inverters" ON public.inverters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = inverters.meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can insert their inverters" ON public.inverters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can update their inverters" ON public.inverters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = inverters.meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can delete their inverters" ON public.inverters FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = inverters.meter_id AND m.user_id = auth.uid())
);

-- Circuits (panel circuits) linked to smart meters
CREATE TABLE IF NOT EXISTS public.circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.smart_meters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breaker_rating_amps INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.circuits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their circuits" ON public.circuits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = circuits.meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can insert their circuits" ON public.circuits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can update their circuits" ON public.circuits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = circuits.meter_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can delete their circuits" ON public.circuits FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.smart_meters m WHERE m.id = circuits.meter_id AND m.user_id = auth.uid())
);

-- Device instances linked to a circuit (or directly to meter if unknown)
CREATE TABLE IF NOT EXISTS public.device_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.smart_meters(id) ON DELETE CASCADE,
  circuit_id UUID REFERENCES public.circuits(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status public.appliance_status NOT NULL DEFAULT 'off',
  power_rating_w INTEGER DEFAULT 0 CHECK (power_rating_w >= 0),
  total_kwh NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.device_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their device_instances" ON public.device_instances FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.smart_meters m WHERE m.id = device_instances.meter_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their device_instances" ON public.device_instances FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.smart_meters m WHERE m.id = meter_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their device_instances" ON public.device_instances FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.smart_meters m WHERE m.id = device_instances.meter_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete their device_instances" ON public.device_instances FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.smart_meters m WHERE m.id = device_instances.meter_id AND m.user_id = auth.uid()
  )
);

-- Views to maintain backward compatibility (optional):
-- Create a view that selects device_instances as appliances for read-only parity
CREATE OR REPLACE VIEW public.v_appliances AS
SELECT 
  di.id,
  m.user_id,
  di.name,
  di.status,
  di.power_rating_w,
  di.total_kwh,
  di.created_at,
  di.updated_at
FROM public.device_instances di
JOIN public.smart_meters m ON m.id = di.meter_id;


