import React from 'react';

interface LandingHeroProps {
  onGetStarted: () => void;
  isTransitioning: boolean;
}

export function LandingHero({ onGetStarted, isTransitioning }: LandingHeroProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-opacity duration-300
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ background: 'transparent' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 text-center flex flex-col items-center">
        
        {/* Hackathon Badge */}
        <div className="badge badge-accent mb-8 select-none">
          🏆 Vibe2Ship Hackathon · Google for Developers
        </div>

        {/* Main Heading */}
        <h1 className="t-display mb-4 select-none">
          The Last-Minute <span className="t-accent">Life Saver</span>
        </h1>

        {/* Tagline */}
        <p className="t-body" style={{ maxWidth: '480px', marginTop: '12px', marginBottom: '32px' }}>
          Stop staring at an overwhelming to-do list. Upload your task details or assignment photo, and let our agentic AI coach structure an actionable roadmap.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 w-full text-left">
          {/* Card 1 */}
          <div className="card card-interactive">
            <div className="text-2xl mb-2 select-none">🤖</div>
            <h3 className="t-title mb-1">Agentic Planning</h3>
            <p className="t-body">
              AI that re-plans in real time as you progress
            </p>
          </div>

          {/* Card 2 */}
          <div className="card card-interactive">
            <div className="text-2xl mb-2 select-none">📷</div>
            <h3 className="t-title mb-1">Vision Input</h3>
            <p className="t-body">
              Snap your assignment and extract tasks instantly
            </p>
          </div>

          {/* Card 3 */}
          <div className="card card-interactive">
            <div className="text-2xl mb-2 select-none">🧠</div>
            <h3 className="t-title mb-1">Proactive Coaching</h3>
            <p className="t-body">
              AI coach that nudges you before you drift
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onGetStarted}
          className="btn btn-primary"
          style={{ maxWidth: '220px' }}
        >
          🚀 Generate My Plan
        </button>

        <p className="muted text-xs mt-4 select-none">
          Free · No login required · Built with Google Gemini
        </p>

      </div>
    </div>
  );
}
export default LandingHero;
