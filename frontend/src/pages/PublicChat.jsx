import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sendChatMessage } from '../api/client';

export default function PublicChat() {
  const { orgId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage(orgId, { session_id: sessionId, message: userMessage });
      setSessionId(res.session_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-shell">
      <div className="chat-header">Chat with us</div>
      <div className="chat-body">
        {messages.length === 0 && (
          <p style={{ color: 'var(--slate)', fontSize: 13 }}>Ask about hours, services, or anything else.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending} className="btn btn-primary">Send</button>
      </form>
    </div>
  );
}