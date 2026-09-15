import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/exhibits');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-stone-700 text-sm mb-2 uppercase">Sign in</h1>
        <p className="text-stone-500 mb-6">Access your private museum dashboard.</p>

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
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pixel-input"
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full pixel-btn">
            {submitting ? '…' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-stone-500 mt-6">
          <Link to="/forgot-password" className="text-amber-400 hover:text-amber-500">
            Forgot your password?
          </Link>
        </p>

        <p className="text-stone-500 mt-4">
          New here? <Link to="/register" className="text-amber-400 hover:text-amber-500">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
