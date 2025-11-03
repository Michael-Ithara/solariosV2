-- Add more comprehensive achievements if they don't exist
INSERT INTO achievements (code, title, description, category, max_progress, points)
VALUES 
  ('peak_shifter', 'Peak Shifter', 'Reduce usage during peak hours by 20%', 'efficiency', 20, 75),
  ('solar_streak', 'Solar Streak', 'Generate solar power for 7 consecutive days', 'solar', 7, 150),
  ('co2_champion', 'CO₂ Champion', 'Save 10kg of CO₂ through solar usage', 'solar', 10, 250),
  ('energy_efficient', 'Energy Efficient', 'Maintain consumption below average for 14 days', 'efficiency', 14, 175),
  ('battery_master', 'Battery Master', 'Store and use 50 kWh from battery', 'efficiency', 50, 200)
ON CONFLICT (code) DO NOTHING;

-- Create function to initialize user achievements
CREATE OR REPLACE FUNCTION initialize_user_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user achievement records for all achievements that don't exist
  INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
  SELECT 
    p_user_id,
    a.id,
    0,
    false,
    NULL
  FROM achievements a
  WHERE NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
  );
  
  -- Initialize user_points if not exists
  INSERT INTO user_points (user_id, xp, points, level)
  VALUES (p_user_id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create trigger function to auto-initialize achievements for new users
CREATE OR REPLACE FUNCTION trigger_initialize_user_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM initialize_user_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_init_achievements ON profiles;
CREATE TRIGGER on_profile_created_init_achievements
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_initialize_user_achievements();

-- Initialize achievements for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT user_id FROM profiles
  LOOP
    PERFORM initialize_user_achievements(user_record.user_id);
  END LOOP;
END;
$$;