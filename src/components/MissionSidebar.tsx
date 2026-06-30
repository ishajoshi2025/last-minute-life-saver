import React from 'react';
import { Mission } from '@/types/mission';

interface MissionSidebarProps {
  missions: Mission[];
  activeMissionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  priorityAdvice?: string | null;
  onAskAdvice?: () => void;
  isFetchingAdvice?: boolean;
}

export function MissionSidebar({
  missions,
  activeMissionId,
  onSelect,
  onNew,
  onDelete,
  priorityAdvice,
  onAskAdvice,
  isFetchingAdvice,
}: MissionSidebarProps) {
  
  // Format the countdown display
  const formatCountdown = (deadlineStr: string): string => {
    if (!deadlineStr || deadlineStr.trim() === '') return 'No deadline';
    const target = new Date(deadlineStr);
    if (isNaN(target.getTime())) return deadlineStr; // fallback to text

    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return 'Overdue';

    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    return `${hours}h ${mins}m left`;
  };

  // Determine badge styling based on risk score
  const getRiskBadge = (score: number): string => {
    if (score >= 70) return 'badge badge-green';
    if (score >= 40) return 'badge badge-amber';
    return 'badge badge-red';
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 70) return 'Safe';
    if (score >= 40) return 'Risk';
    return 'Danger';
  };

  return (
    <aside
      style={{
        width: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Sidebar Header */}
      <div className="t-caption" style={{ marginBottom: '12px', fontWeight: 700 }}>
        Missions
      </div>

      {/* New Mission Action Button */}
      <button
        type="button"
        onClick={onNew}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '12px',
          marginBottom: '12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        + New Mission
      </button>

      {/* AI Priority Advisor block */}
      {missions.length >= 2 && (
        <div style={{ marginBottom: '12px' }}>
          <button
            type="button"
            disabled={isFetchingAdvice}
            onClick={onAskAdvice}
            className="btn btn-secondary w-full"
            style={{ fontSize: '11px', padding: '6px' }}
          >
            {isFetchingAdvice ? 'Analyzing...' : '🧠 What should I work on?'}
          </button>
        </div>
      )}

      {/* Priority Advice Display Card */}
      {priorityAdvice && (
        <div
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid rgba(124,106,247,0.25)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            color: 'var(--text-1)',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}
        >
          {priorityAdvice}
        </div>
      )}

      {/* Active Missions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
        {missions.map((mission) => {
          const isActive = activeMissionId === mission.id;
          const completedCount = mission.tasks.filter((t) => t.isComplete).length;
          const totalCount = mission.tasks.length;

          return (
            <div
              key={mission.id}
              onClick={() => onSelect(mission.id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
                ...(isActive
                  ? {
                      background: 'var(--surface-2)',
                      border: '1px solid rgba(124,106,247,0.3)',
                      borderRadius: '8px',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                    }),
              }}
              className={!isActive ? 'hover:border-[var(--border)]' : ''}
            >
              {/* Task description (truncated) */}
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  color: 'var(--text-1)',
                  marginBottom: '3px',
                  paddingRight: '22px', // space for absolute close button
                  fontWeight: 600
                }}
              >
                {mission.taskDescription || 'Untitled Mission'}
              </div>

              {/* Progress and Risk Badge row */}
              <div style={{ minHeight: '18px', marginTop: '4px' }}>
                <span className={getRiskBadge(mission.riskScore)} style={{ float: 'right', fontSize: '9px', padding: '1px 5px' }}>
                  {getRiskLabel(mission.riskScore)}
                </span>
                <span className="t-caption" style={{ fontSize: '11px', display: 'inline-block' }}>
                  {completedCount}/{totalCount} done
                </span>
              </div>

              {/* Countdown bottom row */}
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                {formatCountdown(mission.deadline)}
              </div>

              {/* Absolute Close/Delete Trigger Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Clear this mission from list?')) {
                    onDelete(mission.id);
                  }
                }}
                className="btn btn-ghost"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '16px',
                  height: '16px',
                  padding: 0,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
                title="Delete Mission"
              >
                &times;
              </button>
            </div>
          );
        })}

        {/* Empty State */}
        {missions.length === 0 && (
          <div className="muted text-xs text-center py-6 select-none" style={{ color: 'var(--text-3)' }}>
            No missions yet. Create your first one above.
          </div>
        )}
      </div>
    </aside>
  );
}

export default MissionSidebar;
