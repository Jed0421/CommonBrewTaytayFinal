import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Send, Trophy, MapPin, Sparkles, Coffee, Truck, RotateCcw, Copy, Check, UserCheck } from 'lucide-react';
import { CustomerRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord | null;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
}

export const CustomerBotDrawer: React.FC<Props> = ({ isOpen, onClose, customer }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getGreeting = () => {
    const custName = customer?.fullName || 'there';
    const pts = customer?.loyaltyPoints || 0;
    return `Hi **${custName}**! ☕ Welcome to **CommonBrew Taytay**!

I am **CommonBot**, your dedicated AI assistant for CommonBrew Taytay. To give you the best cafe experience, I am specialized in:
- 👤 **Customer Status**: View your account details, phone, and delivery address
- 📦 **Order Status**: Live status of your orders, delivery rider tracking, and ETA
- ⭐ **Loyalty Points Status**: Check your balance (**${pts}/100 pts**), earning rate (5 pts per ₱50), and ₱110 reward redemption
- 🏆 **Best Sellers**: Top 10 drinks and pastries, flavor recommendations, and menu prices
- ☕ **Brewing & Coffee Tips**: Coffee beans, brewing techniques (espresso, cold brew, pour-over), and pastry pairings
- ℹ️ **General Inquiries**: Store hours (7 AM – 10 PM), Taytay location, contact info, and payment methods

*Note: I only respond to inquiries regarding CommonBrew Taytay and coffee.* How can I help you today?`;
  };

  useEffect(() => {
    if (customer || isOpen) {
      if (messages.length === 0) {
        setMessages([
          {
            sender: 'bot',
            text: getGreeting()
          }
        ]);
      }
    }
  }, [customer?.id, isOpen]);

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
        text: `New chat started! Hello ${customer?.fullName || 'there'}! ☕ How can I assist you with your Customer Status, Order Status, Loyalty Points, Best Sellers, Brewing Tips, or General Inquiries today?`
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
      const custToken = localStorage.getItem('commonbrew_customer_token');
      const res = await fetch('/api/customer-chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(custToken ? { 'x-customer-token': custToken } : {})
        },
        body: JSON.stringify({
          question: query,
          customerId: customer?.id,
          customerName: customer?.fullName,
          history: newMsgs.map(m => ({
            role: m.sender === 'bot' ? 'assistant' : 'user',
            content: m.text
          }))
        })
      });

      const data = await res.json();
      setMessages([...newMsgs, { sender: 'bot', text: data.reply || 'No response received.' }]);
    } catch (e) {
      setMessages([...newMsgs, { sender: 'bot', text: 'Apologies! I had trouble connecting to the AI service. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ai-overlay" onClick={onClose}></div>
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-header" style={{ background: 'linear-gradient(135deg, #1e1b18 0%, #2c1810 100%)', color: '#fff', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
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
                  boxShadow: '0 2px 8px rgba(255, 94, 0, 0.45)'
                }}
              />
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #1e1b18' }} />
            </div>
            <div>
              <p className="ai-title" style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>CommonBot AI Assistant</p>
              <p className="ai-subtitle" style={{ margin: 0, fontSize: '0.72rem', color: '#d1d5db' }}>
                {customer ? `${customer.fullName} • ${customer.loyaltyPoints || 0} Loyalty Pts` : 'CommonBrew Taytay'}
              </p>
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

        <div className="ai-messages" style={{ background: 'var(--bg)', padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        {/* Quick Suggestion Buttons for the 6 Allowed Topics */}
        <div className="ai-suggestions" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '0.6rem 0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          <button
            className="suggestion-chip"
            onClick={() => handleSend("What is my customer account profile and delivery address?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <UserCheck size={13} style={{ color: '#10b981' }} /> Customer Status
          </button>

          <button
            className="suggestion-chip"
            onClick={() => handleSend("What is the status of my order and when will it arrive?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Truck size={13} style={{ color: '#8b5cf6' }} /> Order Status & ETA
          </button>

          <button
            className="suggestion-chip"
            onClick={() => handleSend("What is my loyalty points balance and how do I redeem points?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sparkles size={13} style={{ color: '#ec4899' }} /> Loyalty Points Status
          </button>

          <button
            className="suggestion-chip"
            onClick={() => handleSend("What are the top 10 best-selling drinks and pastries at CommonBrew?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Trophy size={13} style={{ color: '#f59e0b' }} /> Best Sellers
          </button>

          <button
            className="suggestion-chip"
            onClick={() => handleSend("What are your best barista coffee brewing tips and recommendations?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Coffee size={13} style={{ color: '#059669' }} /> Brewing & Coffee Tips
          </button>

          <button
            className="suggestion-chip"
            onClick={() => handleSend("Where is CommonBrew Taytay located and what are your opening hours?")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <MapPin size={13} style={{ color: '#3b82f6' }} /> General Inquiries
          </button>
        </div>

        <div className="ai-input-wrap" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="ai-input"
            placeholder="Ask about Customer Status, Order Status, Loyalty Points, Best Sellers, Brewing Tips, or General Inquiries..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, padding: '0.65rem 0.85rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
          />
          <button
            className="ai-send"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{ background: '#FF5E00', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, borderRadius: '8px', padding: '0.65rem 1rem', border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.6 : 1 }}
          >
            <span>Ask</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
