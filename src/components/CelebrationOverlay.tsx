import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Persona } from '@/lib/persona';

interface CelebrationOverlayProps {
  taskDescription: string;
  totalTasks: number;
  persona?: Persona;
  onClose: () => void;
}

export function CelebrationOverlay({
  taskDescription,
  totalTasks,
  persona,
  onClose,
}: CelebrationOverlayProps) {
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Confetti particles double burst animation
    const fireConfetti = () => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7c6af7', '#22c55e', '#f59e0b', '#ef4444'],
      });
    };

    fireConfetti();
    const timer = setTimeout(fireConfetti, 300);

    // Call victory API to fetch customized Gemini win message
    const fetchWinMessage = async () => {
      try {
        const res = await fetch('/api/win-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskDescription, totalTasks, persona }),
        });

        const data = await res.json();
        if (res.ok && data.message) {
          setWinMessage(data.message);
        } else {
          setWinMessage("Incredible victory! You've accomplished your goal!");
        }
      } catch (err) {
        setWinMessage("Incredible victory! You've accomplished your goal!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWinMessage();

    return () => clearTimeout(timer);
  }, [taskDescription, totalTasks, persona]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="card max-w-md mx-4 text-center relative overflow-hidden flex flex-col items-center">
        {/* Trophy icon */}
        <div className="text-6xl mb-4 select-none animate-bounce">🏆</div>
        
        {/* Text descriptions */}
        <h2 className="t-display mb-2 select-none">
          ALL DONE!
        </h2>
        <div className="badge badge-accent mb-6 select-none">
          You crushed it.
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <p className="muted text-lg font-medium italic mb-6 animate-pulse select-none">
            ...
          </p>
        )}

        {/* Win Message */}
        {winMessage && !isLoading && (
          <p className="t-body italic mb-6 leading-relaxed font-medium">
            "{winMessage}"
          </p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary w-full"
        >
          Start New Task
        </button>
      </div>
    </div>
  );
}
export default CelebrationOverlay;
