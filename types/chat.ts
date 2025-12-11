    // types/chat.ts - Centralized types for chat and user profile
    export type OpenAIChatMessage = {
      role: 'user' | 'assistant' | 'system';
      content: string;
    };

    export type UIMessage = {
      id: string; // Unique ID for React key and DB lookup
      text: string;
      sender: 'user' | 'ai';
      timestamp: Date;
      message_type?: 'text' | 'image' | 'audio' | 'document';
      file_url?: string;
      file_name?: string;
    };

    export type UserProfile = {
      id: string; // auth.uid()
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
    