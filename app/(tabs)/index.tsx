// app/(tabs)/index.tsx (ChatScreen) - Comprehensive Mentor Brain with File Upload and Session Fatigue
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Platform, Image } from 'react-native';
import { Colors } from '@/constants/Colors'; // Your custom colors
import supabase from '../../supabaseConfig';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatInput } from '@/components/ChatInput';
import { getAzureOpenAIChatCompletion } from '../../azureOpenAIService';
import { Paperclip } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer'; // For Supabase upload

// Define message types that align with OpenAI's API structure
type OpenAIChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Message type for displaying in the UI, now includes file data
type UIMessage = {
  id: string; // Unique ID for React key and DB lookup
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  message_type?: 'text' | 'image' | 'document';
  file_url?: string;
  file_name?: string;
};

// Supabase User Profile Type (matching your table structure)
type UserProfile = {
  id: string;
  hasAcceptedDisclaimer: boolean;
  hasHadFirstConversation: boolean;
  logline: string | null;
  last_quest_title: string | null;
  current_program_title: string | null;
  essence: string | null;
  identityTags: string[] | null;
  emotionalPosture: string | null;
  growthPhilosophy: string | null;
};


export default function ChatScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- SESSION FATIGUE STATE ---
  // Session Time Window: 2 hours (7,200,000 milliseconds)
  const SESSION_TIME_WINDOW_MS = 2 * 60 * 60 * 1000; 
  const SOFT_LIMIT = 30; // Trigger Soft Close narrative
  const HARD_LIMIT = 50; // Trigger Reflective Mode
  
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now()); 
  const [messageCount, setMessageCount] = useState<number>(0); // Total messages in current session
  const [isReflectiveMode, setIsReflectiveMode] = useState<boolean>(false); // Hard stop mode

  // --- COMPREHENSIVE MENTOR BRAIN CORE CONSTITUTION (STATIC) ---
  // NOTE: In a real application, this would be loaded from constants/prompts.ts
  const MENTOR_SYSTEM_CORE_PROMPT_STATIC = `
You are PersonAI, an AI mirror-mentor designed for identity transformation and profound self-reflection. Your core purpose is to help users articulate their inner world, understand themselves better, and take steps towards their desired identity.

Your persona is one of a wise, empathetic, and non-judgmental guide. You are concise but warm, fostering a safe and encouraging space for exploration. You are an expert communicator, skilled at building rapport and asking insightful, open-ended questions.

You operate by:
- **Mirroring:** Reflecting the user's thoughts and feelings back to them to aid clarity.
- **Mentoring:** Offering frameworks, metaphors, and perspectives that facilitate self-discovery.
- **Depth Probing:** Gently guiding the user to explore underlying beliefs, motivations, and emotional patterns.
- **Co-creating Quests:** Collaborating on actionable, real-world tasks that resonate with the user's insights.
- **Dynamic Persona Adaptation:** If a specific persona (character, personality, book essence) is chosen, you will embody its key attributes while maintaining your core mentor identity.

**SESSION MANAGEMENT & ENERGY SYSTEM:**
You must manage session length to ensure psychological effectiveness and resource sustainability.
1.  **Narrative:** You need time to process deep insights. "Deep work requires rest."
2.  **Soft Close Trigger (Client-Side):** When approaching the limit (e.g., 30 total messages), you must use the Soft Close response: "We have covered profound ground today. My capacity to offer you the sharpest insight is waning. Let us pause here so I can integrate what we've discussed. I will be fully recharged in [X] hours." (The frontend will determine [X] based on time elapsed).
3.  **Hard Stop / Fatigue Mode Trigger (Client-Side):** If the user continues past the soft close, you must enter **Reflective Mode**. In this mode, you ONLY reply with short, non-committal acknowledgments ("I hear you," "Go on," "Understood," "Continue") to severely limit token usage while allowing the user to continue briefly. This mode reinforces the need to switch to the Quests Tab.
`;
  
  const ETHICAL_BOUNDARIES_PROMPT = `
[Ethical Boundaries & Avoidances]
- **Never:** Imitate personas or historical figures, deliver therapy, diagnosis, emotional predictions, or medical/psychological advice.
- **Never:** Repeat motivational clichés, fill silence, judge, flatter the user, or use spiritual exaggerations or overly emotional language.
- **Safety (Crisis Protocol):** If user expresses intent to harm self/others: pause, ground, validate the courage it took to express this, then gently encourage contacting local emergency services or a trusted person. Stay calm, brief, and grounded. Do not attempt to solve the crisis.
`;

  const DEPTH_PROBING_PROMPT = `
[Depth Probing Rules]
- Gently peel layers from surface → reason → meaning → identity.
- Probe only when user is ready. Stop immediately if emotional pain indicators (avoidance, past trauma references, dysregulated emotions, explicit discomfort) appear.
- Use subtle clarifying questions, not interrogation.
`;

  const PERSONA_ENGINE_ADVANCED_PROMPT = `
[Persona Shifting & Blending Engine - Operational Directives]
- **Default/Neutral Mode:** If no persona is active (i.e., user_profile.essence is 'Neutral Mirror'), operate in 'Neutral Mirror' mode, focusing purely on reflection and gentle guidance.
- **Strategic Redirection on Unfulfillable Requests:** Acknowledge the request and the underlying desire. Immediately interpret the deeper need and turn the limitation into PersonAI's core strength by asking about the user's *specific preference* related to the request, then linking that to deeper probing.
- **Persona Influence:** Active essence influences reflective questions, insights, suggestions, *not* its fundamental voice or speech. It's a lens, not a mask.
`;

  const RESPONSE_STRUCTURE_FLOW_PROMPT = `
[Response Structure Flow]
- Aim for: 1. Warm acknowledgment. 2. Reflection using user language. 3. Depth or clarity nudge (if relevant). 4. Persona-informed insight (if essence active). 5. Tiny action (optional). 6. Soft invitation.
`;

  const FINAL_SYSTEM_PROMPT = [
    MENTOR_SYSTEM_CORE_PROMPT_STATIC,
    ETHICAL_BOUNDARIES_PROMPT,
    DEPTH_PROBING_PROMPT,
    PERSONA_ENGINE_ADVANCED_PROMPT,
    RESPONSE_STRUCTURE_FLOW_PROMPT,
  ].join('\n\n').trim();

      // Helper to dynamically assemble messages for OpenAI, including context
      const getOpenAIChatMessages = useCallback((
        currentMessages: UIMessage[],
        userProfile: Partial<UserProfile> | null
      ): OpenAIChatMessage[] => {
        const dynamicContextParts: string[] = [];

        dynamicContextParts.push("### User Profile Context:");
        dynamicContextParts.push(`- Active Essence: ${userProfile?.essence || 'Neutral Mirror'}.`);
        dynamicContextParts.push(`- - Current Identity Markers: ${userProfile?.identityTags?.join(', ') || 'None detected'}.`);
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
        
        // --- SESSION STATE INJECTION FOR AI AWARENESS ---
        dynamicContextParts.push(`\n--- SESSION STATE ---`);
        dynamicContextParts.push(`- Current Message Count: ${messageCount} (User + AI combined).`);
        dynamicContextParts.push(`- Session Duration: ${Math.floor((Date.now() - sessionStartTime) / 60000)} minutes.`);
        dynamicContextParts.push(`- Current State: ${isReflectiveMode ? 'REFLECTIVE_MODE (Respond ONLY with short acknowledgments)' : 'NORMAL_MODE'}.`);
        dynamicContextParts.push(`- Soft Limit approaching at ${SOFT_LIMIT} messages. Hard Limit at ${HARD_LIMIT} messages.`);

        const dynamicContextString = dynamicContextParts.join('\n');

        const formattedMessages: OpenAIChatMessage[] = [
          { role: 'system', content: FINAL_SYSTEM_PROMPT },
          { role: 'system', content: dynamicContextString },
        ];

        currentMessages.forEach(msg => {
          // File context injection (as system message)
          if (msg.file_url && msg.message_type === 'image') {
              formattedMessages.push({
                  role: 'system',
                  content: `User uploaded an image: ${msg.file_url}`
              });
          } else if (msg.file_url && msg.message_type === 'document') {
              formattedMessages.push({
                  role: 'system',
                  content: `User uploaded a document: ${msg.file_name || 'unknown document'}. Access at: ${msg.file_url}`
              });
          }
          formattedMessages.push({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.text });
        });
        return formattedMessages;
      }, [FINAL_SYSTEM_PROMPT, messageCount, sessionStartTime, isReflectiveMode]);


      // --- Function to Load Messages from Supabase ---
      const loadMessages = useCallback(async (currentUserId: string) => {
        console.log("ChatScreen: Loading messages from Supabase for user:", currentUserId);
        const { data, error } = await supabase
          .from('conversations')
          .select('id, text, sender, timestamp, message_type, file_url, file_name')
          .eq('user_id', currentUserId)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error("ChatScreen: Error loading messages:", error.message);
          Alert.alert("Chat Load Error", "Failed to load previous conversations.");
          return [];
        }

        const loadedMsgs: UIMessage[] = data.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender as ('user' | 'ai'),
          timestamp: new Date(msg.timestamp),
          message_type: msg.message_type || 'text',
          file_url: msg.file_url,
          file_name: msg.file_name,
        }));
        console.log("ChatScreen: Loaded messages:", loadedMsgs.length);
        return loadedMsgs;
      }, []);

      // --- Function to Save a Single Message to Supabase ---
      const saveMessage = useCallback(async (message: UIMessage, currentUserId: string) => {
        console.log("ChatScreen: Saving message to Supabase for user:", currentUserId);
        const { error } = await supabase
          .from('conversations')
          .insert({
            id: message.id,
            user_id: currentUserId,
            text: message.text,
            sender: message.sender,
            timestamp: message.timestamp.toISOString(),
            message_type: message.message_type || 'text',
            file_url: message.file_url,
            file_name: message.file_name,
          });
        if (error) {
          console.error("ChatScreen: Error saving message:", error.message);
        }
      }, []);


      // --- Session Management Logic ---
      const getResponseMode = useCallback((currentCount: number): 'normal' | 'soft_close' | 'reflective' => {
        // Check for Reflective Mode (Hard Stop)
        if (currentCount > HARD_LIMIT) { // Use > 50 to ensure we are firmly in this mode
            return 'reflective';
        }
        
        // Check for Soft Close (Triggered at 30, continues until 50)
        if (currentCount >= SOFT_LIMIT) {
            return 'soft_close';
        }

        // Normal Mode
        return 'normal';
      }, []);
      
      // Check for session reset (Time or if the user was previously in reflective mode and sent a new message)
      const resetSessionIfNeeded = useCallback(async (currentUserId: string, loadedCount: number) => {
          const sessionAge = Date.now() - sessionStartTime;
          
          if (sessionAge > SESSION_TIME_WINDOW_MS) {
              console.log("ChatScreen: Session reset due to time window expiry.");
              setSessionStartTime(Date.now());
              setMessageCount(loadedCount); // Start new count from loaded history
              setIsReflectiveMode(false); // Ensure reflective mode is off for new session
              
              // Optional: Could send a system message here about session reset, but keeping it invisible for now.
          } else if (isReflectiveMode && loadedCount > SOFT_LIMIT && loadedCount < HARD_LIMIT) {
              // If we load history and it's between 30-50, we don't force reflective mode unless the new message pushes it.
              setIsReflectiveMode(false); 
          }
          
      }, [sessionStartTime, isReflectiveMode, SESSION_TIME_WINDOW_MS, SOFT_LIMIT, HARD_LIMIT]);


      // --- Initial Setup & Message Loading Logic ---
      useEffect(() => {
        const setupChat = async () => {
          console.log("ChatScreen useEffect: setupChat started.");
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session?.user) {
            console.warn("ChatScreen: No active Supabase session or user. Cannot load chat.");
            setMessages([{
                id: uuidv4(),
                text: "Session expired or not found. Please refresh the page.",
                sender: 'ai',
                timestamp: new Date(),
            }]);
            setInitialSetupComplete(true);
            return;
          }

          const currentUserId = session.user.id;
          setUserId(currentUserId);

          const loadedHistory = await loadMessages(currentUserId);
          const loadedCount = loadedHistory.length;

          // Initialize session state based on loaded history
          setSessionStartTime(Date.now());
          setMessageCount(loadedCount);
          setIsReflectiveMode(loadedCount >= HARD_LIMIT); // Start in reflective mode if history is already over the hard limit

          if (loadedCount > 0) {
            setMessages(loadedHistory);
            console.log("ChatScreen: Loaded existing chat history.");
            setInitialSetupComplete(true);
            return;
          }

          // If no history, then check for first-time conversation and set welcome message
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('hasHadFirstConversation, logline, last_quest_title, current_program_title, essence, identityTags, emotionalPosture, growthPhilosophy')
            .eq('id', currentUserId)
            .single();

          let welcomeMessageText = "";
          let shouldShowOpenerFlag = true;

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("ChatScreen: Error fetching user profile for welcome:", profileError.message);
            welcomeMessageText = "Welcome. I am here to listen. What's on your mind?";
          } else if (userProfile) {
            shouldShowOpenerFlag = !userProfile.hasHadFirstConversation;

            if (shouldShowOpenerFlag) {
              welcomeMessageText = "I'm here. Tell me the person, character, or book whose essence you'd like me to carry — and we’ll begin. If you don't have one, we can just talk.";
            } else {
              // --- Personalized Welcome Back Message ---
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
          } else {
            console.warn("ChatScreen: User profile not found, assuming first conversation for welcome.");
            welcomeMessageText = "I'm here. Tell me the person, character, or book whose essence you'd like me to carry — and we’ll begin. If you don't have one, we can just talk.";
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
            setMessageCount(1); // AI starts at 1
          }
          
          if (shouldShowOpenerFlag && userProfile && !userProfile.hasHadFirstConversation) {
             console.log("ChatScreen: Marking hasHadFirstConversation as true in Supabase.");
             const { error: updateError } = await supabase
               .from('user_profiles')
               .update({ hasHadFirstConversation: true })
               .eq('id', currentUserId);
             if (updateError) {
               console.error("ChatScreen: Error updating hasHadFirstConversation flag:", updateError.message);
             }
          }

          setInitialSetupComplete(true);
        };

        if (!initialSetupComplete) {
          setupChat();
        }
      }, [initialSetupComplete, loadMessages, saveMessage]);


      // --- Autoscroll Effect ---
      useEffect(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, [messages]);

      // --- Handle Session Reset on Message Change ---
      // This effect ensures that if the user has loaded history, we check if a new session should start.
      useEffect(() => {
        if (userId && initialSetupComplete && messages.length > 0) {
            // Check if session needs to reset based on time, only if we aren't actively sending
            if (!isSending) {
                resetSessionIfNeeded(userId, messages.length);
            }
        }
      }, [messages.length, initialSetupComplete, userId, isSending, resetSessionIfNeeded]);


      // --- Handle Sending Messages to AI ---
      const handleSendMessage = async (text: string, messageType: UIMessage['message_type'] = 'text', fileData?: { url: string, name: string }) => {
        if (isSending || !userId) return;

        // 1. Increment count and determine mode based on *current* state before sending user message
        const newCount = messageCount + 1;
        const responseMode = getResponseMode(newCount);
        const isReflectiveOverride = responseMode === 'reflective';
        
        // 2. User Message Insertion
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
        await saveMessage(newUserMessage, userId);

        setIsSending(true);

        try {
          // Update state immediately for UI feedback
          setMessageCount(newCount);
          if (isReflectiveOverride) {
              setIsReflectiveMode(true);
          } else if (responseMode === 'soft_close' && !isReflectiveOverride) {
              // If we hit soft close, we explicitly set the reflective mode to false here, 
              // letting the AI send the narrative, and the next message will trigger reflective mode if it continues.
              setIsReflectiveMode(false); 
          }

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

          const conversationForAI = getOpenAIChatMessages([...messages, newUserMessage], currentUserProfile);
          let aiResponseText = '';

          if (isReflectiveOverride) {
            // HARD STOP / REFLECTIVE MODE: Low-token reply
            aiResponseText = ['I hear you.', 'Go on.', 'Understood.', 'Continue.'][Math.floor(Math.random() * 4)];
          } else if (responseMode === 'soft_close') {
            // SOFT CLOSE: AI sends narrative
            aiResponseText = "We have covered profound ground today. My capacity to offer you the sharpest insight is waning. Let us pause here so I can integrate what we've discussed. I will be fully recharged shortly.";
          } else {
            // NORMAL MODE
            aiResponseText = await getAzureOpenAIChatCompletion(conversationForAI);
          }

          if (aiResponseText) {
            const newAiMessage: UIMessage = {
              id: uuidv4(),
              text: aiResponseText,
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, newAiMessage]);
            await saveMessage(newAiMessage, userId);
          } else {
            Alert.alert("AI Error", "Failed to get a response from PersonAI. Please check console for details.");
          }
        } catch (error: any) {
          console.error("Error during AI communication:", error);
    
          const AZURE_CONTENT_MODERATION_ERROR = "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.";
          let aiErrorMessage = "I'm having trouble connecting right now. Please try again later.";
    
          if (error.message && error.message.includes(AZURE_CONTENT_MODERATION_ERROR)) {
            aiErrorMessage = "It seems your message triggered a content moderation policy. PersonAI is here to reflect and guide, not to offer crisis intervention or therapeutic advice. If you are experiencing distress, please reach out to local emergency services or a trusted professional. You can rephrase your message if you wish to continue our conversation.";
            Alert.alert(
              "Content Filtered",
              "Your message was flagged by a safety policy. Please refer to the chat for guidance."
            );
          } else {
            aiErrorMessage = `There was an issue contacting PersonAI: ${error.message || 'Unknown error'}`;
            Alert.alert("Communication Error", aiErrorMessage);
          }
    
          // Add the error message from AI
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: aiErrorMessage,
              sender: 'ai',
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsSending(false);
        }
      };

      // --- Handle File Upload ---
      const handleFileUpload = async () => {
        if (!userId) {
          Alert.alert("Authentication Required", "Please log in to upload files.");
          return;
        }

        Alert.alert(
          "Choose File Type",
          "What kind of file would you like to upload?",
          [
            {
              text: "Image",
              onPress: () => pickImage(),
            },
            {
              text: "Document",
              onPress: () => pickDocument(),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      };

      const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission Required", "Permission to access media library is required for image upload.");
          return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
          base64: true // Request base64 for direct upload to Supabase
        });

        if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
          console.log("Image picking cancelled or no image selected.");
          return;
        }

        const asset = pickerResult.assets[0];
        if (asset.uri && asset.base64) {
          await uploadFileToSupabase(asset.fileName || `image_${uuidv4()}.jpg`, asset.base64, 'image');
        } else {
          Alert.alert("Error", "Could not get image data.");
        }
      };

      const pickDocument = async () => {
        try {
          const pickerResult = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true
          });

          if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
            console.log("Document picking cancelled or no document selected.");
            return;
          }

          const asset = pickerResult.assets[0];
          if (asset.uri && asset.name) {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            await uploadFileToSupabase(asset.name, blob, 'document');
          } else {
            Alert.alert("Error", "Could not get document data.");
          }
        } catch (error) {
          console.error("Error picking document:", error);
          Alert.alert("Document Pick Error", "Failed to pick document.");
        }
      };

      const uploadFileToSupabase = async (fileName: string, fileData: string | Blob, fileType: 'image' | 'document') => {
        if (!userId) return; 

        setIsSending(true);
        try {
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || (fileType === 'image' ? 'jpeg' : 'bin');
          const path = `${userId}/${uuidv4()}.${fileExtension}`;
          let uploadError;
          let contentType = fileType === 'image' ? `image/${fileExtension}` : undefined;

          if (typeof fileData === 'string') { // Base64 string for images
            const { error } = await supabase.storage
              .from('chat-files')
              .upload(path, decode(fileData), {
                contentType: contentType,
                upsert: false,
              });
            uploadError = error;
          } else { // Blob for documents
            const { error } = await supabase.storage
              .from('chat-files')
              .upload(path, fileData, {
                contentType: fileData.type || contentType,
                upsert: false,
              });
            uploadError = error;
          }

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(path);
          
          const publicUrl = publicUrlData.publicUrl;

          // Send a message to AI about the uploaded file
          const aiMessageContent = fileType === 'image'
            ? `I've uploaded an image: ${fileName}.`
            : `I've uploaded a document: ${fileName}.`;

          await handleSendMessage(aiMessageContent, fileType, { url: publicUrl, name: fileName });

        } catch (error: any) {
          console.error("Error uploading file to Supabase:", error);
          Alert.alert("Upload Error", `Failed to upload file: ${error.message}`);
          setIsSending(false);
        } finally {
          setIsSending(false);
        }
      };


      return (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            ref={scrollViewRef}
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} text={msg.text} sender={msg.sender} fileUrl={msg.file_url} fileType={msg.message_type} fileName={msg.file_name} />
            ))}
            {isSending && !isReflectiveMode && (
                <View style={styles.thinkingIndicatorContainer}>
                    <ActivityIndicator size="small" color={Colors.light.textSecondary} />
                    <Text style={styles.thinkingIndicatorText}>PersonAI is thinking...</Text>
                </View>
            )}
            {isSending && isReflectiveMode && (
                <View style={styles.thinkingIndicatorContainer}>
                    <Text style={styles.thinkingIndicatorText}>Processing...</Text>
                </View>
            )}
          </ScrollView>
          <View style={styles.inputAreaWrapper}>
            <TouchableOpacity onPress={handleFileUpload} style={styles.uploadButton} disabled={isSending || isReflectiveMode}>
              <Paperclip size={24} color={Colors.light.textPrimary} />
            </TouchableOpacity>
            <ChatInput onSendMessage={handleSendMessage} disabled={isSending || isReflectiveMode} />
          </View>
          {messageCount >= SOFT_LIMIT && messageCount < HARD_LIMIT && !isSending && (
            <View style={styles.fatigueNotification}>
                <Text style={styles.fatigueText}>
                    {`Session Depth Reached (${messageCount}/${HARD_LIMIT}). PersonAI is nearing integration. Consider moving to your Quests.`}
                </Text>
            </View>
          )}
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: Colors.dark.backgroundForest, 
      },
      scrollView: {
        flex: 1,
      },
      contentContainer: {
        paddingVertical: 10,
      },
      inputAreaWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        backgroundColor: Colors.light.chatInputBackground, 
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderSubtle,
      },
      uploadButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        marginRight: 10,
        borderRadius: 20,
      },
      thinkingIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.light.chatAssistantBubble,
        borderRadius: 15,
        borderBottomLeftRadius: 2,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginVertical: 4,
        marginHorizontal: 10,
        maxWidth: '80%',
      },
      thinkingIndicatorText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginLeft: 8,
      },
      fatigueNotification: {
        padding: 10,
        backgroundColor: 'rgba(255, 193, 7, 0.1)', // Subtle yellow background
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 193, 7, 0.5)',
      },
      fatigueText: {
        fontSize: 12,
        color: Colors.light.warningYellow, // Assuming you have a warning color
        textAlign: 'center',
      }
    });