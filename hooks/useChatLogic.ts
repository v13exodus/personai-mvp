    // hooks/useChatLogic.ts - Types imported from central file
    import { useState, useEffect, useCallback } from 'react';
    import { Alert } from 'react-native';
    import { v4 as uuidv4 } from 'uuid';

    import supabase from '../supabaseConfig';
    import { getAzureOpenAIChatCompletion } from '../azureOpenAIService';
    import { useMessagePersistence } from './useMessagePersistence';
    import { useUserProfileData } from './useUserProfileData';
    import { buildOpenAIChatMessages } from '../lib/promptBuilder';

    // --- Import Types from Central File ---
    import { OpenAIChatMessage, UIMessage, UserProfile } from '../types/chat';

    // --- MENTOR BRAIN CORE CONSTITUTION (STATIC) ---
    // Modularized and combined from prompt files
    import { CORE_IDENTITY_PROMPT } from '../prompts/coreIdentity';
    import { PHILOSOPHY_AND_ROLE_PROMPT } from '../prompts/philosophyRole';
    import { COMMUNICATION_STYLE_PROMPT } from '../prompts/communicationStyle';
    import { ETHICAL_BOUNDARIES_PROMPT } from '../prompts/ethicalBoundaries';
    import { DEPTH_PROBING_PROMPT } from '../prompts/depthProbing';
    import { MENTAL_HYGIENE_PROMPT } from '../prompts/mentalHygiene';
    import { ACTION_GROWTH_PROMPT } from '../prompts/actionGrowth';
    import { PERSONA_ENGINE_ADVANCED_PROMPT } from '../prompts/personaEngine';
    import { INTELLIGENT_END_CHAT_PROMPT } from '../prompts/endChatProtocol';
    import { PATTERN_OBSERVER_PROMPT } from '../prompts/patternObservation';
    import { RESPONSE_STRUCTURE_FLOW_PROMPT } from '../prompts/responseStructure';

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


    export function useChatLogic(currentUserId: string | null) {
      const [messages, setMessages] = useState<UIMessage[]>([]);
      const [isSending, setIsSending] = useState(false);
      const [initialSetupComplete, setInitialSetupComplete] = useState(false);

      const { loadMessages, saveMessage } = useMessagePersistence();
      const { userProfile, loadingProfile, fetchProfile } = useUserProfileData(currentUserId);


      const getOpenAIChatMessages = useCallback((
        currentMessages: UIMessage[],
        userProfile: Partial<UserProfile> | null
      ): OpenAIChatMessage[] => {
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
      }, [MENTOR_SYSTEM_CORE_PROMPT_STATIC]);


      useEffect(() => {
        const setupChat = async () => {
          if (!currentUserId) {
            console.warn("useChatLogic: No user ID provided. Skipping chat setup.");
            setInitialSetupComplete(true);
            return;
          }

          if (loadingProfile) {
            return;
          }
          if (!userProfile) {
            console.error("useChatLogic: User profile not loaded for chat setup.");
            setMessages([
              {
                id: uuidv4(),
                text: "Error: Could not load your profile. Please refresh.",
                sender: 'ai',
                timestamp: new Date(),
              },
            ]);
            setInitialSetupComplete(true);
            return;
          }

          const loadedHistory = await loadMessages(currentUserId);

          if (loadedHistory.length > 0) {
            setMessages(loadedHistory);
            console.log("useChatLogic: Loaded existing chat history.");
            setInitialSetupComplete(true);
            return;
          }

          let welcomeMessageText = "";
          let shouldShowOpenerFlag = true;

          shouldShowOpenerFlag = !userProfile.hasHadFirstConversation;

          if (shouldShowOpenerFlag) {
            welcomeMessageText = "I'm here. Tell me the person, character, or book whose essence you'd like me to carry — and we’ll begin. If you don't have one, we can just talk.";
          } else {
            const parts = ["Welcome back."];
            if (userProfile.logline) {
              parts.push(`It sounds like you've been reflecting on: "${userProfile.logline}".`);
            }
            if (userProfile.last_quest_title) {
              parts.push(`How did your quest to "${userProfile.last_quest_title}" go?`);
            } else if (userProfile.current_program_title) {
              parts.push(`How is your journey to "${userProfile.current_program_title}" progressing?`);
            }
            if (parts.length === 1) {
                parts.push("I am here to listen.");
            }
            welcomeMessageText = parts.join(" ");
          }

          if (welcomeMessageText) {
            const initialAiMessage: UIMessage = {
              id: uuidv4(),
              text: welcomeMessageText,
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages([initialAiMessage]);
            await saveMessage(initialAiMessage, currentUserId);
          }
          
          if (shouldShowOpenerFlag && !userProfile.hasHadFirstConversation) {
             console.log("useChatLogic: Marking hasHadFirstConversation as true in Supabase.");
             const { error: updateError } = await supabase
               .from('user_profiles')
               .update({ hasHadFirstConversation: true })
               .eq('id', currentUserId);
             if (updateError) {
               console.error("useChatLogic: Error updating hasHadFirstConversation flag:", updateError.message);
             }
          }

          setInitialSetupComplete(true);
        };

        if (currentUserId && !initialSetupComplete && !loadingProfile) {
          setupChat();
        }
      }, [currentUserId, initialSetupComplete, loadingProfile, userProfile, loadMessages, saveMessage]);


      const handleSendMessage = useCallback(async (text: string, messageType: UIMessage['message_type'] = 'text', fileData?: { url: string, name: string }) => {
        if (isSending || !currentUserId || !userProfile) return;

        const newUserMessage: UIMessage = {
          id: uuidv4(),
          text: text,
          sender: 'user',
          timestamp: new Date(),
          message_type: messageType,
          file_url: fileData?.url,
          file_name: fileData?.name,
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        await saveMessage(newUserMessage, currentUserId);

        setIsSending(true);

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          let currentUserProfile: Partial<UserProfile> | null = null;
          if (sessionData?.user) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('essence, identityTags, logline, last_quest_title, current_program_title, emotionalPosture, growthPhilosophy')
              .eq('id', sessionData.user.id)
              .single();
            currentUserProfile = profileData;
          }

          const conversationForAI = buildOpenAIChatMessages([...messages, newUserMessage], currentUserProfile);
          const aiResponseText = await getAzureOpenAIChatCompletion(conversationForAI);

          if (aiResponseText) {
            const newAiMessage: UIMessage = {
              id: uuidv4(),
              text: aiResponseText,
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, newAiMessage]);
            // Removed await onAiResponse(aiResponseText); // Voice output is disabled for MVP
            await saveMessage(newAiMessage, currentUserId);
          } else {
            Alert.alert("AI Error", "Failed to get a response from PersonAI. Please check console for details.");
          }
        } catch (error: any) {
          console.error("useChatLogic: Error during AI communication:", error);
          Alert.alert("Communication Error", `There was an issue contacting PersonAI: ${error.message || 'Unknown error'}`);
          setMessages((prevMessages) => [...prevMessages, {
            id: uuidv4(),
            text: "I'm having trouble connecting right now. Please try again later.",
            sender: 'ai',
            timestamp: new Date(),
          }]);
        } finally {
          setIsSending(false);
        }
      }, [isSending, currentUserId, userProfile, messages, saveMessage]);

      return {
        messages,
        isSending,
        handleSendMessage,
        initialSetupComplete,
        loadingChatLogic: isSending || loadingProfile,
      };
    }
    