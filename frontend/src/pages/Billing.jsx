import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCheckout } from '../api/client';
import { Link } from 'react-router-dom';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$29', desc: 'For getting started with a single location.' },
  { id: 'pro', name: 'Pro', price: '$79', desc: 'Higher volume, priority support.' },
];

export default function Billing() {
  const { orgId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (planId) => {
    setLoadingPlan(planId);
    setError('');
    try {
      const { checkout_url } = await createCheckout(orgId, planId);
      window.location.href = checkout_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start checkout');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="app-shell" style={{ maxWidth: 600 }}>
      <Link to="/dashboard" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 16 }}>&larr; Dashboard</Link>
      <span className="eyebrow">Billing</span>
      <h1 style={{ fontSize: 28, marginBottom: 32 }}>Choose a plan</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="plan-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className="plan-card">
            <span className="badge">{plan.name}</span>
            <div className="plan-price">{plan.price}<span style={{ fontSize: 14, color: 'var(--slate)' }}>/mo</span></div>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>{plan.desc}</p>
            <button onClick={() => handleSubscribe(plan.id)} disabled={loadingPlan === plan.id} className="btn btn-primary">
              {loadingPlan === plan.id ? 'Redirecting...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}