    // hooks/useUserProfileData.ts - Types imported from central file
    import { useState, useEffect, useCallback } from 'react';
    import supabase from '../supabaseConfig';
    import { UserProfile } from '../types/chat'; // <--- NEW: Import UserProfile from central types

    export function useUserProfileData(userId: string | null) {
      const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
      const [loadingProfile, setLoadingProfile] = useState(true);

      const fetchProfile = useCallback(async () => {
        if (!userId) {
          setUserProfile(null);
          setLoadingProfile(false);
          return;
        }

        console.log("useUserProfileData: Fetching user profile for:", userId);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('hasAcceptedDisclaimer, hasHadFirstConversation, logline, last_quest_title, current_program_title, essence, identityTags, emotionalPosture, growthPhilosophy')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("useUserProfileData: Error fetching user profile:", error.message);
          setUserProfile(null);
        } else if (data) {
          setUserProfile(data as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoadingProfile(false);
      }, [userId]);

      useEffect(() => {
        fetchProfile();
      }, [fetchProfile]);

      return { userProfile, loadingProfile, fetchProfile };
    }
    