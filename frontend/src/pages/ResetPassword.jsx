import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/reset-password', { token, password });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset your password');
    } finally {
      setSubmitting(false);
    }
  }

  const done = message && !error;

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="pixel-panel p-8 text-center">
          <h1 className="font-pixel text-stone-700 text-sm mb-2 uppercase">All set</h1>
          <p className="text-stone-500 mb-6">{message}</p>
          <Link to="/login" className="pixel-btn text-[0.5rem]">
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-stone-700 text-sm mb-2 uppercase">Choose a new password</h1>
        <p className="text-stone-500 mb-6">Pick a password of at least 8 characters.</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">NEW PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full pixel-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full pixel-input"
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full pixel-btn">
            {submitting ? '…' : 'SET NEW PASSWORD'}
          </button>
        </form>

        <p className="text-stone-500 mt-6">
          Remembered it? <Link to="/login" className="text-amber-400 hover:text-amber-500">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
