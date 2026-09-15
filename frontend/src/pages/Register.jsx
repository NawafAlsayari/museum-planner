import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '', username: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/admin/exhibits');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { key: 'displayName', label: 'Display name', type: 'text', maxLength: 60 },
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      minLength: 3,
      maxLength: 30,
      pattern: '[A-Za-z0-9_-]+',
      title: '3-30 characters: letters, numbers, _ or -',
    },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'password', label: 'Password', type: 'password', minLength: 8 },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="pixel-panel p-8">
        <h1 className="font-pixel text-stone-700 text-sm mb-2 uppercase">Create your museum</h1>
        <p className="text-stone-500 mb-6">Sign up to start your own public museum & planner.</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1 text-stone-400">{f.label.toUpperCase()}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={update(f.key)}
                required
                minLength={f.minLength}
                maxLength={f.maxLength}
                pattern={f.pattern}
                title={f.title}
                className="w-full pixel-input"
              />
            </div>
          ))}
          <button type="submit" disabled={submitting} className="w-full pixel-btn">
            {submitting ? '…' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-stone-500 mt-6">
          Already have an account? <Link to="/login" className="text-amber-400 hover:text-amber-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
