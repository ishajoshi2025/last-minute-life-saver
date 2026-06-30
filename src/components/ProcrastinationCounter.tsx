import { useState, useEffect } from 'react';

interface ProcrastinationCounterProps {
  planGeneratedAt: Date;
  totalTasks: number;
  completedTasks: number;
}

export default function ProcrastinationCounter({
  planGeneratedAt,
  totalTasks,
  completedTasks,
}: ProcrastinationCounterProps) {
  // Initialize state based on elapsed time to prevent resets on component remounts
  const [secondsElapsed, setSecondsElapsed] = useState(() =>
    Math.floor((Date.now() - planGeneratedAt.getTime()) / 1000)
  );

  useEffect(() => {
    // Reset or resync if plan time changes
    setSecondsElapsed(Math.floor((Date.now() - planGeneratedAt.getTime()) / 1000));

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [planGeneratedAt]);

  // If all tasks are completed, show a green celebration card
  if (totalTasks > 0 && completedTasks === totalTasks) {
    return (
      <div className="card-sm card-success row w-full">
        <span className="badge badge-green">🎉 Complete</span>
        <span className="t-body" style={{ fontWeight: 600 }}>
          You did it! Zero procrastination lost — you crushed it.
        </span>
      </div>
    );
  }

  // Derive idle stats
  const timeSpentIdle = secondsElapsed - completedTasks * 15 * 60; // 15 mins per completed task
  const idleMinutes = Math.floor(Math.max(0, timeSpentIdle) / 60);
  const idleSeconds = Math.max(0, timeSpentIdle) % 60;
  const tasksCouldHaveDone = Math.floor(Math.max(0, timeSpentIdle) / (15 * 60));

  // If very early in the plan (first 30 idle seconds), show a green encouragement banner
  if (idleMinutes === 0 && idleSeconds < 30) {
    return (
      <div className="card-sm card-success row w-full">
        <span className="badge badge-green">🚀 Active</span>
        <span className="t-body" style={{ fontWeight: 600 }}>
          Great, you just started! Keep the momentum going.
        </span>
      </div>
    );
  }

  return (
    <div className="card-sm card-danger row w-full">
      {/* Left Warning Badge */}
      <span className="badge badge-red">⏰ Idle</span>
      
      {/* Main Stats Text */}
      <span className="t-body">
        You've spent{' '}
        <strong style={{ color: 'var(--red)', fontWeight: 800 }}>{idleMinutes}m {idleSeconds}s</strong>{' '}
        not working. 
        {tasksCouldHaveDone > 0 && (
          <>
            {' '}That's{' '}
            <strong style={{ color: 'var(--red)', fontWeight: 800 }}>{tasksCouldHaveDone}</strong>{' '}
            micro-task{tasksCouldHaveDone > 1 ? 's' : ''} you could have finished.
          </>
        )}
      </span>
    </div>
  );
}
