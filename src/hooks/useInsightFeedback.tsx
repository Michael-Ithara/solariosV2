import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface InsightFeedback {
  insightId: string;
  helpful: boolean;
  notes?: string;
}

export function useInsightFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  const submitFeedback = async (recommendationId: string, helpful: boolean, notes?: string) => {
    if (!user) return;

    setSubmittingFeedback(recommendationId);

    try {
      // For now, just log feedback locally
      // In production, create a dedicated feedback table
      console.log('User feedback:', {
        recommendationId,
        helpful,
        notes,
        timestamp: new Date().toISOString(),
        userId: user.id
      });

      toast({
        title: "Feedback received",
        description: "Thank you for helping improve our AI recommendations!",
      });

      // If user found it helpful, award XP through gamification
      if (helpful) {
        // Future: award bonus XP for using AI insights
        // This could be integrated with the gamification system
        console.log('User found insight helpful - could award 10 XP');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(null);
    }
  };

  return {
    submitFeedback,
    submittingFeedback
  };
}
