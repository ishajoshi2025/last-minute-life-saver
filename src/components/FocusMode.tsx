import { useState, useEffect } from 'react';
import { Task } from '@/lib/parsePlan';

interface FocusModeProps {
  task: Task;
  taskIndex: number;
  totalTasks: number;
  onComplete: (id: string) => void;
  onExit: () => void;
  persona: 'supportive' | 'savage';
}

export function FocusMode({
  task,
  taskIndex,
  totalTasks,
  onComplete,
  onExit,
  persona,
}: FocusModeProps) {
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isDone, setIsDone] = useState(false);

  // Timer logic
  useEffect(() => {
    if (!isRunning || isDone) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsDone(true);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isDone]);

  // Keyboard Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  // Determine color theme based on time remaining
  let timerColor = 'var(--text-1)';
  if (secondsLeft < 120) {
    timerColor = 'var(--red)';
  } else if (secondsLeft <= 300) {
    timerColor = 'var(--amber)';
  }

  // Handle Mark Complete execution
  const handleMarkComplete = () => {
    onComplete(task.id);
    onExit();
  };

  // Reset timer configuration for extra time
  const handleNeedMoreTime = () => {
    setSecondsLeft(15 * 60);
    setIsDone(false);
    setIsRunning(true);
  };

  const progressPercent = ((1560 - secondsLeft) / 1560) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 24px', textAlign: 'center' }}>
        
        {/* Row 1: Muted Task Index Title */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          Task {taskIndex + 1} of {totalTasks}
        </div>

        {/* Row 2: Timer display */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
            color: timerColor,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '24px',
            transition: 'color 0.5s ease',
          }}
        >
          {mins}:{secs}
        </div>

        {/* Row 3: Progress Bar track */}
        <div
          style={{
            width: '100%',
            height: '2px',
            background: 'var(--surface-3)',
            borderRadius: '1px',
            marginBottom: '32px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: timerColor,
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Row 4: Task description text */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-1)',
            lineHeight: 1.4,
            marginBottom: '40px',
            letterSpacing: '-0.01em',
          }}
        >
          {task.text}
        </div>

        {/* Row 5: Action Controls */}
        {!isDone ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleMarkComplete}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              ✓ Mark Complete
            </button>
            <button
              type="button"
              onClick={onExit}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              ← Exit Focus
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--amber)' }}>
              ⏱ Time's up!
            </div>
            
            <p className="t-body" style={{ fontStyle: 'italic', marginBottom: '8px' }}>
              {persona === 'savage'
                ? "Stop stalling. Did you finish it or not?"
                : "Great effort! How did it go?"}
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                onClick={handleMarkComplete}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                ✓ Done!
              </button>
              
              <button
                type="button"
                onClick={handleNeedMoreTime}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Need more time
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default FocusMode;
