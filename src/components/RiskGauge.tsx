import { useState, useEffect } from 'react';

interface RiskGaugeProps {
  score: number;
  label: string;
  color: string;
  message: string;
}

export function RiskGauge({ score, label, color, message }: RiskGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to the actual target score on mount
    let current = 0;
    const interval = setInterval(() => {
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        current += 2;
        if (current >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(current);
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [score]);

  // Determine badge styling using the global badge tokens
  const getBadgeClasses = (lbl: string) => {
    if (lbl === "Danger Zone") return "badge badge-red";
    if (lbl === "At Risk") return "badge badge-amber";
    return "badge badge-green";
  };

  const getScoreColorVar = (colorHex: string) => {
    if (colorHex === "#22c55e") return "var(--green)";
    if (colorHex === "#f59e0b") return "var(--amber)";
    return "var(--red)";
  };

  const scoreColor = getScoreColorVar(color);

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      
      {/* Small Header */}
      <div>
        <span className="t-caption">
          🎯 Completion Probability
        </span>
      </div>

      {/* Row 1: Score & Label Pill */}
      <div className="row justify-between" style={{ justifyContent: 'space-between' }}>
        <div className="row items-baseline" style={{ alignItems: 'baseline' }}>
          <span 
            className="t-title"
            style={{ color: scoreColor, fontSize: '24px', fontWeight: 'bold' }}
          >
            {displayScore}
          </span>
          <span className="muted" style={{ fontSize: '11px', marginLeft: '2px' }}>/100</span>
        </div>
        
        <span className={getBadgeClasses(label)}>
          {label}
        </span>
      </div>

      {/* Row 2: Progress Bar */}
      <div className="progress-track" style={{ height: '3px', marginTop: '8px' }}>
        <div
          className="progress-fill"
          style={{ 
            width: `${displayScore}%`, 
            backgroundColor: scoreColor 
          }}
        />
      </div>

      {/* Row 3: Description Message */}
      <div className="t-body" style={{ marginTop: '8px' }}>
        <p className="muted" style={{ fontStyle: 'italic' }}>
          {message}
        </p>
      </div>

    </div>
  );
}
export default RiskGauge;
