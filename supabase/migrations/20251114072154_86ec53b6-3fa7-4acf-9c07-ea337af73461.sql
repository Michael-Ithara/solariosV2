-- Add confidence level to track ML vs heuristic recommendations
ALTER TABLE ai_recommendations 
ADD COLUMN IF NOT EXISTS confidence TEXT CHECK (confidence IN ('high', 'medium', 'low'));