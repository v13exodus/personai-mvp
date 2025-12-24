// functions/_shared/phases.ts
import { AppPhase } from './types.ts';

export const PHASE_INSTRUCTIONS: Record<AppPhase, string> = {
  PERSONA_VALIDATION: `
    GOAL: Observation 1.
    INSTRUCTION: Validate the persona essence. Ask what the user looks up to in this essence and why it matters now.
    CONSTRAINT: Do not probe motivation or feelings yet.
  `,
  EXTRACTION: `
    GOAL: Observations 2, 3, and 4.
    INSTRUCTION: Move through Motivation Understanding, Feeling Inhabitation, and Identity Reflection. 
    Linger on repetitions. Use metaphors to illuminate the user's inner world.
    CONSTRAINT: Step 6 is in effect. Do not assess readiness or suggest any actions.
  `,
  READINESS_WORTHINESS: `
    GOAL: Observation 7 (Part A).
    INSTRUCTION: Assess readiness and worthiness collaboratively. 
    Challenge the user: "Is the current way of being worthy of the chosen essence?"
  `,
  BLUEPRINT_NEGOTIATION: `
    GOAL: Observation 7 (Part B).
    INSTRUCTION: Propose the Protocol (Actions/Missions). 
    Seek consensus. Mend the protocol if the user provides valid resistance. 
    Ensure the 'Price Tag' is clear.
  `,
  PROTOCOL_CONSENSUS: `
    GOAL: Final Installation.
    INSTRUCTION: Confirm the final agreement. 
    Once the user accepts, signal the lock by outputting the tag: [PROTOCOL_LOCKED].
  `,
  THE_COUNSEL: `
    GOAL: Daily Alignment.
    INSTRUCTION: Monitor the protocol. 
    Reflect on 'Glitches' (failures) and reinforce identity adoption.
  `
};

/**
 * Transitions are gated. 
 * The AI must output [TRANSITION_READY] to move between these phases.
 */
export const PHASE_ORDER: AppPhase[] = [
  'PERSONA_VALIDATION',
  'EXTRACTION',
  'READINESS_WORTHINESS',
  'BLUEPRINT_NEGOTIATION',
  'PROTOCOL_CONSENSUS',
  'THE_COUNSEL'
];