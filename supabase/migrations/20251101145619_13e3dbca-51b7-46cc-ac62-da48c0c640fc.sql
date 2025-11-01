-- Add admin RLS policies to allow admins to view system-wide data

-- Admin policy for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin policy for appliances
CREATE POLICY "Admins can view all appliances"
ON public.appliances
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin policy for energy_logs
CREATE POLICY "Admins can view all energy logs"
ON public.energy_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));