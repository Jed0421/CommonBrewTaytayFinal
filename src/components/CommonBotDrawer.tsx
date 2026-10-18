import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Banknote, AlertTriangle, Trophy, Send, RotateCcw, Copy, Check, Sparkles, Coffee, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

export const CommonBotDrawer: React.FC<Props> = ({ isOpen, onClose, userName }) => {
  const initialGreeting = `Hello ${userName || 'there'}! I am **CommonBot**, your AI assistant for CommonBrew Taytay. ☕

I can help you just like ChatGPT:
- 📊 Analyze live sales, revenue metrics & transaction trends
- 📦 Check current ingredient stock levels & critical inventory alerts
- ☕ Answer any coffee brewing questions, recipes, or barista techniques
- 💡 Provide business insights, math, writing, and general answers

How can I help you today?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: initialGreeting
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: `Chat reset! Hello ${userName || 'there'}! ☕ How can I assist you with CommonBrew Taytay or any general questions today?`
      }
    ]);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim() || loading) return;

    const newMsgs: Message[] = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const staffToken = localStorage.getItem('commonbrew_staff_token');
      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'Authorization': `Bearer ${staffToken}` } : {})
        },
        body: JSON.stringify({
          question: query,
          history: newMsgs.map(m => ({
            role: m.sender === 'bot' ? 'assistant' : 'user',
            content: m.text
          }))
        })
      });

      const data = await res.json();
      setMessages([...newMsgs, { sender: 'bot', text: data.reply || 'No answer received.' }]);
    } catch (e) {
      setMessages([...newMsgs, { sender: 'bot', text: 'Apologies! I encountered an error communicating with the AI service. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ai-overlay" onClick={onClose}></div>
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #1e1b18 0%, #2a241e 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="/commonbot-avatar.jpg"
                alt="CommonBot"
                referrerPolicy="no-referrer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #FF5E00',
                  boxShadow: '0 2px 8px rgba(255, 94, 0, 0.4)'
                }}
              />
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #1e1b18' }} />
            </div>
            <div>
              <p className="ai-title" style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>CommonBot AI</p>
              <p className="ai-subtitle" style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>ChatGPT-style AI • CommonBrew POS</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleResetChat}
              title="Start New Chat"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#d1d5db', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
            >
              <RotateCcw size={12} />
              <span>New</span>
            </button>
            <button className="ai-close" onClick={onClose} style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: '0.3rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg)' }}>
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ${m.sender}`} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.sender === 'bot' && (
                <img
                  src="/commonbot-avatar.jpg"
                  alt="CommonBot"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #FF5E00',
                    flexShrink: 0,
                    marginTop: '2px',
                    boxShadow: '0 2px 6px rgba(255, 94, 0, 0.25)'
                  }}
                />
              )}
              <div
                className="msg-bubble"
                style={{
                  position: 'relative',
                  background: m.sender === 'user' ? '#FF5E00' : 'var(--surface)',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text)',
                  border: m.sender === 'bot' ? '1px solid var(--border)' : 'none',
                  borderRadius: m.sender === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  padding: '0.75rem 1rem',
                  maxWidth: '85%'
                }}
              >
                {m.sender === 'bot' ? (
                  <>
                    <div className="ai-markdown">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', paddingTop: '0.3rem', borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-2)',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          opacity: 0.75
                        }}
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check size={12} style={{ color: '#10b981' }} />
                            <span style={{ color: '#10b981' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-msg bot" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <img
                src="/commonbot-avatar.jpg"
                alt="CommonBot"
                referrerPolicy="no-referrer"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #FF5E00',
                  flexShrink: 0
                }}
                className="animate-pulse"
              />
              <div className="msg-bubble" style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '4px 14px 14px 14px' }}>
                <Sparkles size={15} className="animate-spin" style={{ color: '#FF5E00' }} />
                <span style={{ fontSize: '0.82rem' }}>CommonBot is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-suggestions" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '0.6rem 0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          <button className="suggestion-chip" onClick={() => handleSend("What is today's total revenue and sales breakdown?")} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Banknote size={13} style={{ color: '#10b981' }} /> Today's Sales
          </button>
          <button className="suggestion-chip" onClick={() => handleSend("Which raw ingredients are critically low in stock?")} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={13} style={{ color: '#ef4444' }} /> Low Stock Alert
          </button>
          <button className="suggestion-chip" onClick={() => handleSend("What are our top best-selling products?")} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Trophy size={13} style={{ color: '#f59e0b' }} /> Top Products
          </button>
          <button className="suggestion-chip" onClick={() => handleSend("What is the recipe and milk ratio for our Iced Spanish Latte?")} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Coffee size={13} style={{ color: '#8b5cf6' }} /> Recipe Guide
          </button>
        </div>

        <div className="ai-input-wrap" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="ai-input"
            placeholder="Ask CommonBot anything (sales, stock, coffee, general questions)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, padding: '0.65rem 0.85rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
          />
          <button
            className="ai-send"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{ background: '#FF5E00', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', opacity: loading || !input.trim() ? 0.6 : 1 }}
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
