-- Ensure unique appliance names per user
ALTER TABLE public.appliances
  ADD CONSTRAINT IF NOT EXISTS uq_appliances_user_name UNIQUE (user_id, name);

-- Harden RLS for appliances if missing (assumes RLS enabled via prior migration)
DO $$ BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appliances' AND policyname = 'Users select own appliances';
  IF NOT FOUND THEN
    CREATE POLICY "Users select own appliances" ON public.appliances FOR SELECT USING (auth.uid() = user_id);
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appliances' AND policyname = 'Users insert own appliances';
  IF NOT FOUND THEN
    CREATE POLICY "Users insert own appliances" ON public.appliances FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appliances' AND policyname = 'Users update own appliances';
  IF NOT FOUND THEN
    CREATE POLICY "Users update own appliances" ON public.appliances FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appliances' AND policyname = 'Users delete own appliances';
  IF NOT FOUND THEN
    CREATE POLICY "Users delete own appliances" ON public.appliances FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


