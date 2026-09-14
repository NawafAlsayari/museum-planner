import { useState } from 'react';
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isPublic, setIsPublic] = useState(user?.isPublic !== false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/api/auth/me', { displayName, isPublic });
      await refreshUser();
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-pixel text-stone-100 text-xs mb-4 uppercase">Settings</h2>

      {message && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{message}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>}

      <form onSubmit={handleSubmit} className="pixel-panel p-6 max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1 text-stone-400">DISPLAY NAME</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full pixel-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-stone-400">MUSEUM VISIBILITY</label>
          <p className="text-sm text-stone-500 mb-2">
            Your public page is at <span className="bg-stone-100 px-1 border border-stone-900">/museum/{user?.username}</span>
          </p>
          <label className="flex items-center gap-3 border-2 border-stone-900 bg-stone-100 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="text-stone-200">Make my museum visible to the public</span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="pixel-btn text-[0.5rem]">
          {saving ? 'SAVING…' : 'SAVE SETTINGS'}
        </button>
      </form>
    </div>
  );
}
