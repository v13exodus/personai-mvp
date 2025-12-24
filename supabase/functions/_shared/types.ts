// functions/_shared/types.ts

export type AppPhase = 
  | 'PERSONA_VALIDATION'   // Step 2 (Observation 1)
  | 'EXTRACTION'           // Steps 3, 4, 5 (Observations 2, 3, 4)
  | 'READINESS_WORTHINESS' // Step 8 (Observation 7 - Part A)
  | 'BLUEPRINT_NEGOTIATION'// Step 8 (Observation 7 - Part B)
  | 'PROTOCOL_CONSENSUS'   // Step 8 (Final Installation)
  | 'THE_COUNSEL';         // Maintenance Mode

export interface Action {
  title: string;
  type: 'routine' | 'task';
  frequency?: 'daily' | 'once';
  description: string;
}

/** 
 * SUBSCRIPTION & TIMER ADDITIONS
 * ────────────────────────────── 
 */

export type SubscriptionTier = 'spark' | 'pulse' | 'breakthrough' | 'deep_dive';

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  spark: 300,        // 5 mins
  pulse: 900,        // 15 mins
  breakthrough: 1800, // 30 mins
  deep_dive: 3600    // 60 mins
};

export interface UserFocusState {
  tier: SubscriptionTier;
  remainingSeconds: number;
  lastResetAt: string; // ISO Timestamp
  isTimerActive: boolean;
}

/**
 * GLOW DYNAMICS
 * Calculation: (elapsedTime / totalAllowance)
 * Maps to a 0.0 to 1.0 value for animation
 */
export interface GlowState {
  intensity: number; // 0.0 to 1.0
  color: string;
}