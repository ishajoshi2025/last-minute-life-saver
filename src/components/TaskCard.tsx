import { Task } from '@/lib/parsePlan';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onBlocked: (id: string) => void;
  onFocus: (id: string) => void;
}

export function TaskCard({ task, onComplete, onBlocked, onFocus }: TaskCardProps) {
  return (
    <div
      className={`task-item ${task.isComplete ? 'is-complete' : ''} ${task.isBlocked ? 'is-blocked' : ''}`}
    >
      <div className="flex items-start space-x-3 flex-1">
        {/* Standard Design Checkbox Input */}
        <input
          type="checkbox"
          checked={task.isComplete}
          onChange={() => onComplete(task.id)}
          className="task-checkbox"
        />

        {/* Task text with done class on complete */}
        <span
          className={`task-text ${task.isComplete ? 'done' : ''}`}
        >
          {task.text}
        </span>
      </div>

      {/* Buttons container */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {/* Focus Trigger Button */}
        <button
          type="button"
          disabled={task.isComplete}
          onClick={() => onFocus(task.id)}
          style={{
            background: 'transparent',
            color: 'var(--text-3)',
            border: '1px solid var(--border)',
            borderRadius: '5px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="hover:border-[var(--border-md)] hover:text-[var(--text-1)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶ Focus
        </button>

        {/* Stuck Button classified as task-stuck-btn */}
        <button
          type="button"
          disabled={task.isComplete}
          onClick={() => onBlocked(task.id)}
          className="task-stuck-btn"
        >
          Stuck 🚧
        </button>
      </div>
    </div>
  );
}
export default TaskCard;
