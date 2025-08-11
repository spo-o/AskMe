
import { supabase } from '../services/supabaseClient';
import { PLAN_LIMITS } from './subscriptionLimit';

type UsageType = 'ask_count' | 'analysis_count' | 'scenario_count';

export const checkUsageLimit = async (
  userId: string,
  usageType: UsageType
): Promise<{ allowed: boolean; message?: string }> => {
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, ask_count, analysis_count, scenario_count, subscription_active')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { allowed: false, message: 'User not found.' };
  }

  const plan = user.plan as keyof typeof PLAN_LIMITS; // <-- Add this type assertion
  const limits = PLAN_LIMITS[plan];

  if (!limits) {
    return { allowed: false, message: 'Unknown subscription plan.' };
  }

  const currentUsage = user[usageType];
  const allowedUsage = {
    ask_count: limits.askLimit,
    analysis_count: limits.analysisLimit,
    scenario_count: limits.scenarioLimit,
  }[usageType];

  const isAllowed = currentUsage > 0;

  return {
    allowed: isAllowed,
    message: isAllowed ? undefined : `Limit reached for ${usageType.replace('_', ' ')}`,
  };
};