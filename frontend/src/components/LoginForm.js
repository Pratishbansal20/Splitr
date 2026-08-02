import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { isGirly } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/groups');
    } catch (err) {
      setError((err?.response?.data?.message) || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Splitr" className={`w-auto ${isGirly ? 'h-32' : 'h-16 rounded-md'}`} />
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>
        {isGirly ? 'Sign in to Splitr' : 'Sign in'}
      </h2>
      <p className="small-muted mb-4 text-center">
        {isGirly ? 'Quickly split bills with friends and track who owes what.' : 'Track shared expenses and settle up.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-1.5">Email</label>
          <input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="alice@example.com" />
        </div>
        <div>
          <label className="label-eyebrow block mb-1.5">Password</label>
          <input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        {error && <div className="text-sm font-medium" style={{ color: 'var(--loss)' }}>{error}</div>}

        <div className="flex items-center justify-between pt-1">
          <button type="submit" className="btn-primary">Sign in</button>
          <Link className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }} to="/register">Create account</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
