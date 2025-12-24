// hooks/useFocusTimer.ts
import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useFocusTimer = (initialSeconds: number, totalAllowance: number) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      setIsActive(true);
    } else {
      setIsActive(false);
      // Here: Trigger a Supabase update to save 'seconds'
    }
  };

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, seconds]);

  // The Bell Curve for the Glow
  // Intensity is highest at 50% time remaining
  const calculateIntensity = () => {
    const progress = (totalAllowance - seconds) / totalAllowance;
    // Simple bell curve: sin(progress * PI)
    return Math.max(0.05, Math.sin(progress * Math.PI));
  };

  return {
    seconds,
    intensity: calculateIntensity(),
    isActive,
    setIsActive
  };
};