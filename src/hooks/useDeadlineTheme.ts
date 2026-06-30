import { useState, useEffect } from 'react';

export function useDeadlineTheme(deadline: string): {
  theme: 'calm' | 'alert' | 'critical' | 'none';
  hoursLeft: number;
  label: string;
} {
  // Safe compute logic
  function computeTheme(dl: string) {
    if (!dl || dl.trim() === '') {
      return { theme: 'none' as const, hoursLeft: Infinity, label: '' };
    }
    const deadlineDate = new Date(dl);
    if (isNaN(deadlineDate.getTime())) {
      // Fallback if deadline entered is general text that Date fails to parse
      return { theme: 'calm' as const, hoursLeft: 48, label: 'ON TRACK' };
    }

    const hours = (deadlineDate.getTime() - Date.now()) / 3600000;

    let theme: 'calm' | 'alert' | 'critical' | 'none' = 'calm';
    let label = 'ON TRACK';

    if (hours <= 0) {
      theme = 'critical';
      label = 'DEADLINE PASSED';
    } else if (hours < 6) {
      theme = 'critical';
      label = 'CRITICAL';
    } else if (hours < 24) {
      theme = 'alert';
      label = 'ALERT';
    }

    return { theme, hoursLeft: hours, label };
  }

  const [themeData, setThemeData] = useState(() => computeTheme(deadline));

  useEffect(() => {
    setThemeData(computeTheme(deadline));

    const interval = setInterval(() => {
      setThemeData(computeTheme(deadline));
    }, 60000);

    return () => clearInterval(interval);
  }, [deadline]);

  return themeData;
}
export default useDeadlineTheme;
