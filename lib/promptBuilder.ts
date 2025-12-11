    // lib/promptBuilder.ts - Types imported from central file
    import { UIMessage, UserProfile, OpenAIChatMessage } from '../types/chat'; // <--- NEW: Import types from central file
    import { CORE_IDENTITY_PROMPT, PHILOSOPHY_AND_ROLE_PROMPT, COMMUNICATION_STYLE_PROMPT, ETHICAL_BOUNDARIES_PROMPT, DEPTH_PROBING_PROMPT, MENTAL_HYGIENE_PROMPT, ACTION_GROWTH_PROMPT, PERSONA_ENGINE_ADVANCED_PROMPT, INTELLIGENT_END_CHAT_PROMPT, PATTERN_OBSERVER_PROMPT, RESPONSE_STRUCTURE_FLOW_PROMPT } from '../prompts/index';

    const MENTOR_SYSTEM_CORE_PROMPT_STATIC = [
      CORE_IDENTITY_PROMPT,
      PHILOSOPHY_AND_ROLE_PROMPT,
      COMMUNICATION_STYLE_PROMPT,
      ETHICAL_BOUNDARIES_PROMPT,
      DEPTH_PROBING_PROMPT,
      MENTAL_HYGIENE_PROMPT,
      ACTION_GROWTH_PROMPT,
      PERSONA_ENGINE_ADVANCED_PROMPT,
      INTELLIGENT_END_CHAT_PROMPT,
      PATTERN_OBSERVER_PROMPT,
      RESPONSE_STRUCTURE_FLOW_PROMPT,
    ].join('\n\n').trim();

    export function buildOpenAIChatMessages(
      currentMessages: UIMessage[],
      userProfile: Partial<UserProfile> | null
    ): OpenAIChatMessage[] {
      const dynamicContextParts: string[] = [];

      dynamicContextParts.push("### User Profile Context:");
      dynamicContextParts.push(`- Active Essence: ${userProfile?.essence || 'Neutral Mirror'}.`);
      dynamicContextParts.push(`- Current Identity Markers: ${userProfile?.identityTags?.join(', ') || 'None detected'}.`);
      dynamicContextParts.push(`- Last Insight/Focus: ${userProfile?.logline || 'None recorded'}.`);

      let activeGoal = 'No active goal';
      if (userProfile?.current_program_title) {
          activeGoal = userProfile.current_program_title;
      } else if (userProfile?.last_quest_title) {
          activeGoal = userProfile.last_quest_title;
      }
      dynamicContextParts.push(`- Active Goal/Quest: ${activeGoal}.`);

      dynamicContextParts.push(`- User Emotional Posture: ${userProfile?.emotionalPosture || 'Undetermined'}.`);
      dynamicContextParts.push(`- User Growth Philosophy: ${userProfile?.growthPhilosophy || 'Undetermined'}.`);

      const dynamicContextString = dynamicContextParts.join('\n');

      const formattedMessages: OpenAIChatMessage[] = [
        { role: 'system', content: MENTOR_SYSTEM_CORE_PROMPT_STATIC },
        { role: 'system', content: dynamicContextString },
      ];

      currentMessages.forEach(msg => {
        if (msg.message_type === 'text') {
          formattedMessages.push({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.text });
        }
      });
      return formattedMessages;
    }
    