import { useState, useEffect } from 'react';

interface NegotiatorModalProps {
  taskDescription: string;
  deadline: string;
  riskScore: number;
  completedCount: number;
  totalCount: number;
  onClose: () => void;
}

export function NegotiatorModal({
  taskDescription,
  deadline,
  riskScore,
  completedCount,
  totalCount,
  onClose,
}: NegotiatorModalProps) {
  const [recipientType, setRecipientType] = useState('Professor');
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Call the negotiator email builder route
  const fetchEmail = async (type: string) => {
    setIsLoading(true);
    setEmail(null);
    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription,
          deadline,
          recipientType: type,
          riskScore,
          completedCount,
          totalCount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.subject) {
        setEmail({ subject: data.subject, body: data.body });
      }
    } catch (err) {
      console.error('Failed to generate negotiation email:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount (useEffect with [] deps)
  useEffect(() => {
    fetchEmail(recipientType);
  }, []);

  const handleRecipientChange = (newType: string) => {
    setRecipientType(newType);
    fetchEmail(newType);
  };

  const handleCopy = () => {
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recipientOptions = ['Professor', 'Manager', 'Client'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '512px', 
          padding: '28px',
          margin: '0 16px'
        }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 className="t-heading flex items-center space-x-2">
            <span>😅</span>
            <span>The Negotiator</span>
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-ghost"
          >
            &times;
          </button>
        </div>

        {/* Subtitle */}
        <p className="t-body" style={{ marginBottom: '16px' }}>
          Your plan is in trouble. Let AI draft the email for you.
        </p>

        {/* Recipient Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label className="field-label">Who are you emailing?</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {recipientOptions.map((opt) => {
              const isActive = recipientType === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleRecipientChange(opt)}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    border: '1px solid var(--border)',
                    ...(isActive && {
                      borderColor: 'var(--accent)',
                      color: 'var(--text-1)',
                      background: 'var(--accent-dim)'
                    })
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
            {/* skeleton subject line */}
            <div className="skeleton" style={{ height: '38px', width: '70%', borderRadius: 'var(--radius-sm)' }} />
            {/* 3 skeleton body lines with varying widths */}
            <div className="skeleton" style={{ height: '16px', width: '95%', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ height: '16px', width: '85%', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ height: '16px', width: '90%', borderRadius: 'var(--radius-sm)' }} />
          </div>
        )}

        {/* Email Fields Display */}
        {email && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Subject */}
            <div>
              <label className="field-label">Subject</label>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--text-1)',
                  marginTop: '4px'
                }}
              >
                {email.subject}
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="field-label">Body</label>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border-md)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--text-1)',
                  whiteSpace: 'pre-wrap',
                  minHeight: '160px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}
              >
                {email.body}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            disabled={isLoading || !email}
            onClick={handleCopy}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {copied ? '✓ Copied!' : 'Copy Email'}
          </button>

          <button
            type="button"
            disabled={isLoading || !email}
            onClick={() => fetchEmail(recipientType)}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Regenerate
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default NegotiatorModal;
