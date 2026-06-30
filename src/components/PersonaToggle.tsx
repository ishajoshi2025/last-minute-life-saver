import React from 'react';
import { Persona, PERSONA_CONFIG } from '@/lib/persona';

interface PersonaToggleProps {
  persona: Persona;
  onChange: (p: Persona) => void;
}

export function PersonaToggle({ persona, onChange }: PersonaToggleProps) {
  const options: Persona[] = ['supportive', 'savage'];

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '3px',
        alignItems: 'center',
        width: 'fit-content'
      }}
    >
      {options.map((opt) => {
        const isActive = persona === opt;
        const config = PERSONA_CONFIG[opt];

        // Dynamic styling for active and savage tint modes
        let btnStyle: React.CSSProperties = {
          border: 'none',
          borderRadius: '999px',
          padding: '5px 14px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'transparent',
          color: 'var(--text-3)'
        };

        if (isActive) {
          if (opt === 'savage') {
            btnStyle = {
              ...btnStyle,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171'
            };
          } else {
            btnStyle = {
              ...btnStyle,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-md)',
              color: 'var(--text-1)'
            };
          }
        }

        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={btnStyle}
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default PersonaToggle;
