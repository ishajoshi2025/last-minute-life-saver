import { useEffect, useRef, useState } from 'react';

export function useDriftDetector(options: {
  taskDescription: string;
  energyLevel: number;
  isActive: boolean;
  onDriftDetected: (minutesIdle: number) => void;
  snoozeDurationMs?: number;
}) {
  const lastActivityRef = useRef<number>(Date.now());
  const [isSnoozed, setIsSnoozed] = useState(false);

  // Keep options in a ref to avoid resetting the interval timer loop unnecessarily on state changes
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Window activity event listeners
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Proactive 30-second idle validation loops
  useEffect(() => {
    const interval = setInterval(() => {
      const { isActive, onDriftDetected } = optionsRef.current;
      
      if (!isActive || isSnoozed) {
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (idleMs >= fiveMinutesMs) {
        onDriftDetected(Math.floor(idleMs / 60000));
        // Reset activity reference to avoid re-firing in the next interval
        lastActivityRef.current = Date.now();
      }
    }, 30000); // Runs every 30 seconds

    return () => clearInterval(interval);
  }, [isSnoozed]);

  // Snooze handler
  const snooze = () => {
    setIsSnoozed(true);
    const duration = optionsRef.current.snoozeDurationMs ?? 5 * 60 * 1000; // Defaults to 5 minutes
    
    setTimeout(() => {
      setIsSnoozed(false);
      lastActivityRef.current = Date.now(); // Reset activity on unsnooze
    }, duration);
  };

  return { snooze };
}
