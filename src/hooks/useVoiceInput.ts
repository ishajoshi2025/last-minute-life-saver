import { useState, useRef, useEffect } from 'react';

export function useVoiceInput(onResult: (transcript: string) => void): {
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
} {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  // Keep callback reference updated to avoid SpeechRecognition recreate loops
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        setIsSupported(true);
        try {
          const rec = new SpeechRecognitionClass();
          rec.continuous = false;
          rec.lang = 'en-US';
          rec.interimResults = false;

          rec.onresult = (event: any) => {
            if (event.results && event.results[0] && event.results[0][0]) {
              const transcript = event.results[0][0].transcript;
              onResultRef.current(transcript);
            }
          };

          rec.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
              setError(event.error || 'Speech recognition error.');
            }
            setIsListening(false);
          };

          rec.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = rec;
        } catch (e: any) {
          console.error('Failed to initialize SpeechRecognition class:', e);
        }
      }
    }
  }, []);

  const start = () => {
    setError(null);
    if (recognitionRef.current) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e: any) {
        setError(e.message || 'Failed to start speech recognition.');
        setIsListening(false);
      }
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e: any) {
        console.error('Failed to stop speech recognition:', e);
      }
    }
  };

  return { isListening, isSupported, start, stop, error };
}
