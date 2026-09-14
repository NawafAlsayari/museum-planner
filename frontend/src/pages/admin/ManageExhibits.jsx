import { useEffect, useState } from 'react';
import api from '../../api.js';
import { API_BASE } from '../../components/ExhibitCard.jsx';

const TYPES = ['PHOTO', 'PROJECT', 'ACHIEVEMENT'];

const emptyForm = { type: 'PHOTO', title: '', description: '', date: '' };

export default function ManageExhibits() {
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/exhibits');
      setExhibits(res.data.exhibits);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exhibits');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImage(null);
    setError('');
  }

  function startEdit(exhibit) {
    setEditingId(exhibit.id);
    setForm({
      type: exhibit.type,
      title: exhibit.title,
      description: exhibit.description || '',
      date: exhibit.date ? exhibit.date.slice(0, 10) : '',
    });
    setImage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let exhibit;
      if (editingId) {
        const res = await api.put(`/api/exhibits/${editingId}`, form);
        exhibit = res.data.exhibit;
      } else {
        const res = await api.post('/api/exhibits', form);
        exhibit = res.data.exhibit;
      }
      if (image) {
        const fd = new FormData();
        fd.append('image', image);
        await api.post(`/api/exhibits/${exhibit.id}/image`, fd);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save exhibit');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exhibit?')) return;
    try {
      await api.delete(`/api/exhibits/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete exhibit');
    }
  }

  const body = loading ? (
    <p className="text-stone-500">Loading…</p>
  ) : exhibits.length === 0 ? (
    <p className="text-stone-500">No exhibits yet. Add your first one below.</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {exhibits.map((exhibit) => (
        <div key={exhibit.id} className="pixel-panel overflow-hidden">
          <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden border-b-2 border-stone-900">
            {exhibit.imageUrl ? (
              <img src={`${API_BASE}${exhibit.imageUrl}`} alt={exhibit.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl opacity-40">🖼️</span>
            )}
          </div>
          <div className="p-4">
            <span className="pixel-tag bg-stone-200 text-stone-400 uppercase">{exhibit.type}</span>
            <h3 className="font-serif text-lg mt-2 text-stone-100 uppercase">{exhibit.title}</h3>
            <p className="text-sm text-stone-500 line-clamp-2 mt-1">{exhibit.description}</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => startEdit(exhibit)} className="pixel-btn pixel-btn--secondary text-[0.5rem]">
                EDIT
              </button>
              <button onClick={() => handleDelete(exhibit.id)} className="pixel-btn pixel-btn--danger text-[0.5rem]">
                DELETE
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel text-stone-100 text-xs uppercase">Museum Exhibits</h2>
        <button onClick={resetForm} className="pixel-btn pixel-btn--secondary text-[0.5rem]">
          NEW EXHIBIT
        </button>
      </div>

      <form onSubmit={handleSubmit} className="pixel-panel p-6 mb-8">
        <h3 className="font-pixel text-stone-100 text-xs mb-4 uppercase">
          {editingId ? 'Edit exhibit' : 'Add exhibit'}
        </h3>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">TYPE</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full pixel-input"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-stone-400">DATE</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full pixel-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-stone-400">TITLE</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full pixel-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-stone-400">DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="3"
              className="w-full pixel-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-stone-400">IMAGE (OPTIONAL)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
              className="w-full text-sm text-stone-500 pixel-input file:mr-3 file:pixel-btn file:border-0"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={saving} className="pixel-btn text-[0.5rem]">
            {saving ? 'SAVING…' : editingId ? 'SAVE CHANGES' : 'ADD EXHIBIT'}
          </button>
          <button type="button" onClick={resetForm} className="pixel-btn pixel-btn--secondary text-[0.5rem]">
            CANCEL
          </button>
        </div>
      </form>

      {body}
    </div>
  );
}
