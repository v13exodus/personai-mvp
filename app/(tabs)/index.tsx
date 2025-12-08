    // app/(tabs)/index.tsx (ChatScreen)
    import React, { useRef, useEffect, useState } from 'react';
    import { StyleSheet, Text, View, ScrollView } from 'react-native';
    import { Colors } from '@/constants/Colors';
    import supabase from '../../supabaseConfig';
    import { ChatBubble } from '@/components/ChatBubble';
    import { ChatInput } from '@/components/ChatInput'; // <--- NEW IMPORT

    type Message = {
      id: string;
      text: string;
      sender: 'user' | 'ai';
      timestamp: Date;
    };

    export default function ChatScreen() {
      const scrollViewRef = useRef<ScrollView>(null);
      const [showCanonicalOpener, setShowCanonicalOpener] = useState(false);
      const [initialMessageChecked, setInitialMessageChecked] = useState(false);

      const [messages, setMessages] = useState<Message[]>([]); // Start with an empty array for dynamic messages

      // --- MOCK CANONICAL OPENER LOGIC ---
      useEffect(() => {
        const checkAndSetCanonicalOpener = async () => {
          console.log("ChatScreen useEffect: checkAndSetCanonicalOpener started.");
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session?.user) {
            console.warn("ChatScreen: No active Supabase session or user. Cannot check first-time status.");
            return; // Exit if no user, avoid errors
          }

          const currentUserId = session.user.id;
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('hasHadFirstConversation')
            .eq('id', currentUserId)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("ChatScreen: Error fetching user profile from Supabase:", profileError.message);
            // Default to showing if error, but don't set flag yet
            setShowCanonicalOpener(true);
          } else if (userProfile) {
            setShowCanonicalOpener(!userProfile.hasHadFirstConversation);
          } else {
            setShowCanonicalOpener(true);
          }
          setInitialMessageChecked(true); // Mark check as done
        };

        if (!initialMessageChecked) {
          checkAndSetCanonicalOpener();
        }
      }, [initialMessageChecked]);

      // Effect to display canonical opener or welcome back message when `showCanonicalOpener` state changes
      useEffect(() => {
        if (initialMessageChecked && messages.length === 0) { // Only add if messages are empty and checked
          if (showCanonicalOpener) {
            setMessages([
              {
                id: 'opener',
                text: "Welcome. I am here to listen. To help guide our conversation, is there a personality, a character from a book, or a public figure whose wisdom resonates with you? Or we can simply begin talking.",
                sender: 'ai',
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages([
              {
                id: 'welcome_back',
                text: "Welcome back to PersonAI Chat.",
                sender: 'ai',
                timestamp: new Date(),
              },
            ]);
          }
        }
      }, [showCanonicalOpener, initialMessageChecked]);


      // Effect for autoscroll
      useEffect(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, [messages]); // Scroll whenever messages array changes


      const handleSendMessage = (text: string) => {
        const newUserMessage: Message = {
          id: `user-${Date.now()}`,
          text: text,
          sender: 'user',
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);

        // --- TODO: In Week 2, this is where we'll send the message to the MENTOR Brain (Gemini API) ---
        // For now, simulate an AI response after a short delay
        setTimeout(() => {
          const aiResponse: Message = {
            id: `ai-${Date.now()}`,
            text: `You said: "${text}". I am listening...`, // Placeholder AI response
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages((prevMessages) => [...prevMessages, aiResponse]);
        }, 1000);
      };


      return (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            ref={scrollViewRef}
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} text={msg.text} sender={msg.sender} />
            ))}
          </ScrollView>
          <ChatInput onSendMessage={handleSendMessage} /> {/* <--- NEW COMPONENT */}
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: Colors.light.softGreen,
      },
      scrollView: {
        flex: 1,
      },
      contentContainer: {
        paddingVertical: 10,
      },
    });
    