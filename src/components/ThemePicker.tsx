import React, { useState, useEffect, useRef } from 'react';
import { THEMES, ThemeId } from '@/lib/themes';

interface ThemePickerProps {
  themeId: ThemeId;
  onChange: (id: ThemeId) => void;
}

export function ThemePicker({ themeId, onChange }: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<ThemeId | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on clicks outside panel boundaries
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost"
        style={{ fontSize: '12px', gap: '6px', display: 'flex', alignItems: 'center' }}
      >
        <span>{currentTheme.emoji}</span>
        <span>{currentTheme.name}</span>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="card"
          style={{
            position: 'fixed',
            top: '60px',
            right: '16px',
            zIndex: 200,
            width: 'min(420px, calc(100vw - 32px))',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="t-title">Choose your vibe</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              &times;
            </button>
          </div>

          {/* Subtitle */}
          <p className="t-body" style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--text-2)' }}>
            Changes fonts, colors, and personality
          </p>

          {/* Theme Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '8px',
            }}
          >
            {THEMES.map((theme) => {
              const isActive = theme.id === themeId;
              const isHovered = theme.id === hoveredId;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    onChange(theme.id);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHoveredId(theme.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: theme.bg,
                    border: `2px solid ${
                      isActive
                        ? theme.accent
                        : isHovered
                        ? `${theme.accent}80` // opacity 0.5 border approximation
                        : 'rgba(255,255,255,0.06)'
                    }`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    opacity: isHovered && !isActive ? 0.85 : 1,
                  }}
                >
                  {/* Color dots */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: theme.accent,
                      }}
                    />
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: theme.bg,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#f0f0f0',
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#f0f0f0',
                      marginTop: '8px',
                      marginBottom: '2px',
                    }}
                  >
                    {theme.name}
                  </div>

                  {/* Tagline */}
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.3,
                    }}
                  >
                    {theme.tagline}
                  </div>

                  {/* Active checkmark */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: theme.accent,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemePicker;
