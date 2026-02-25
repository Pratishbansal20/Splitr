import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.user, res.data.token);
      navigate('/groups');
    } catch (err) {
      setError((err?.response?.data?.message) || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Splitr" className="h-32 w-auto" />
      </div>
      <h2 className="text-2xl font-semibold mb-4 text-center">Create your Splitr account</h2>
      <p className="small-muted mb-4">Sign up to start splitting expenses with friends.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input className="input-base" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="alice@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">Create account</button>
          <a className="text-sm text-indigo-600 hover:underline" href="/login">Already have an account?</a>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
