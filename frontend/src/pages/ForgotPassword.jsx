import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request a password reset');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-stone-700 text-sm mb-2 uppercase">Reset password</h1>
        <p className="text-stone-500 mb-6">
          Enter your account email and we'll send you a link to set a new password.
        </p>

        {message && (
          <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{message}</div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pixel-input"
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full pixel-btn">
            {submitting ? '…' : 'SEND RESET LINK'}
          </button>
        </form>

        <p className="text-stone-500 mt-6">
          Remembered it? <Link to="/login" className="text-amber-400 hover:text-amber-500">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
