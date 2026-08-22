import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAgentConfig, updateAgentConfig } from '../api/client';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { orgId, user, logout } = useAuth();
  const [form, setForm] = useState({ business_hours: '', services_offered: '', faq_knowledge_base: '', greeting_message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!orgId) return;
    getAgentConfig(orgId).then((data) => {
      setForm({
        business_hours: data.business_hours || '',
        services_offered: data.services_offered || '',
        faq_knowledge_base: data.faq_knowledge_base || '',
        greeting_message: data.greeting_message || '',
      });
    });
  }, [orgId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await updateAgentConfig(orgId, form);
      setStatus('Saved');
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('Failed to save');
    }
  };

  if (!orgId) return <div className="page-centered">Loading your organization...</div>;

  const publicChatUrl = `${window.location.origin}/chat/${orgId}`;

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div>
          <span className="eyebrow">Deskwise</span>
          <h1 style={{ fontSize: 28 }}>Dashboard</h1>
        </div>
        <nav>
          <span style={{ fontSize: 13, color: 'var(--slate)' }}>{user?.email}</span>
          <Link to="/billing" className="btn btn-secondary">Billing</Link>
          <button onClick={logout} className="btn btn-ghost">Log out</button>
        </nav>
      </div>

      <div className="link-box">
        <span className="eyebrow">Public chat link</span>
        <a href={publicChatUrl} target="_blank" rel="noreferrer">{publicChatUrl}</a>
      </div>

      <span className="eyebrow">AI receptionist</span>
      <h2 style={{ fontSize: 20, marginBottom: 24 }}>Configuration</h2>

      <form onSubmit={handleSave}>
        <div className="field">
          <label>Greeting message</label>
          <input name="greeting_message" value={form.greeting_message} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Business hours (JSON)</label>
          <textarea name="business_hours" value={form.business_hours} onChange={handleChange} rows={3} placeholder='{"mon-fri": "9am-6pm", "sat": "10am-2pm"}' />
        </div>
        <div className="field">
          <label>Services offered (JSON list)</label>
          <textarea name="services_offered" value={form.services_offered} onChange={handleChange} rows={2} placeholder='["Haircut", "Consultation"]' />
        </div>
        <div className="field">
          <label>FAQ / knowledge base</label>
          <textarea name="faq_knowledge_base" value={form.faq_knowledge_base} onChange={handleChange} rows={6} placeholder="Anything customers commonly ask - parking, pricing, policies..." />
        </div>
        <button type="submit" className="btn btn-secondary">Save changes</button>
        {status && <span className="status-text">{status}</span>}
      </form>
    </div>
  );
}