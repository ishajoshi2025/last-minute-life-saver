import { useState, useEffect } from 'react';

interface NudgeNotificationProps {
  message: string;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function NudgeNotification({ message, onDismiss, onSnooze }: NudgeNotificationProps) {
  const [animate, setAnimate] = useState(false);

  // Mounted slide-in animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Web Speech API text-to-speech rendering on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        
        // Cancel any currently playing speech queues, then speak
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Silently ignore speech synthesis errors
      }
    }
  }, [message]);

  return (
    <div
      className={`nudge-card transition-all duration-500 transform
        ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header row */}
      <div className="flex items-center">
        <span className="text-lg mr-1.5 select-none">🤖</span>
        <span className="t-caption t-accent">Your AI Coach</span>
        
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-ghost ml-auto text-xs py-1 px-2"
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* Message text */}
      <p className="t-body" style={{ marginTop: '8px', marginBottom: '12px' }}>
        {message}
      </p>

      {/* Buttons row */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          Let's Go! 💪
        </button>
        
        <button
          type="button"
          onClick={() => {
            onSnooze();
            onDismiss();
          }}
          className="btn btn-ghost"
        >
          5 more min
        </button>
      </div>
    </div>
  );
}
export default NudgeNotification;
