import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupApi } from '../api/client';

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', org_name: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const tokens = await signupApi(form);
      await login(tokens);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <div className="page-centered">
      <div className="card">
        <span className="eyebrow">Deskwise</span>
        <h1 style={{ fontSize: 26, marginBottom: 28 }}>Create your account</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Your name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Business name</label>
            <input name="org_name" value={form.org_name} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign up</button>
        </form>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--slate)' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}