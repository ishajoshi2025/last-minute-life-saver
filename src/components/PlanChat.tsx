import { useState, useRef, useEffect } from 'react';
import { Persona } from '@/lib/persona';

interface PlanChatProps {
  planContext: string;
  taskDescription: string;
  energyLevel: number;
  deadline: string;
  persona?: Persona;
}

export function PlanChat({
  planContext,
  taskDescription,
  energyLevel,
  deadline,
  persona,
}: PlanChatProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll context helper to align messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: textToSend };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          planContext,
          taskDescription,
          energyLevel,
          deadline,
          chatHistory: messages,
          persona,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an issue processing your query.' }]);
      }
    } catch (err) {
      console.error('Failed to communicate with AI chat:', err);
      setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I could not reach the coach. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  const chips = [
    "Simplify the hardest task",
    "What if I only have 30 minutes?",
    "I'm stuck, what should I do first?",
  ];

  return (
    <div className="card mt-6 space-y-4 flex flex-col justify-between">
      
      {/* Header */}
      <div>
        <h4 className="t-title flex items-center space-x-1.5 select-none">
          <span>💬</span>
          <span>Ask Your AI Coach</span>
        </h4>
        <p className="t-caption mt-0.5">
          Ask anything about your plan
        </p>
      </div>

      {/* Message thread container */}
      <div className="max-h-64 overflow-y-auto pr-1 space-y-3 flex flex-col scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={msg.role === 'user' ? 'chat-user' : 'chat-ai'}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading pulsing state bubble */}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="chat-ai animate-pulse">
              ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto Suggestion Chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {chips.map((chip, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSend(chip)}
              className="badge badge-neutral"
              style={{ cursor: 'pointer' }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Message Input controls */}
      <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800/60">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask something about your schedule..."
          className="input"
          style={{ borderRadius: 'var(--radius-md)' }}
          maxLength={2000}
        />
        
        <button
          type="button"
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="btn btn-secondary"
          style={{ flexShrink: 0 }}
        >
          Send
        </button>
      </div>

    </div>
  );
}
export default PlanChat;
