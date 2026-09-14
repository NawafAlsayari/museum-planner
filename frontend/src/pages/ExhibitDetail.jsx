import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api.js';
import { API_BASE } from '../components/ExhibitCard.jsx';

export default function ExhibitDetail() {
  const { id } = useParams();
  const [exhibit, setExhibit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/api/museum/exhibit/${id}`)
      .then((res) => setExhibit(res.data.exhibit))
      .catch(() => setError('Exhibit not found.'));
  }, [id]);

  if (error) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-stone-500">{error}</div>;
  if (!exhibit) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-stone-500">Loading…</div>;

  const img = exhibit.imageUrl ? `${API_BASE}${exhibit.imageUrl}` : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to={`/museum/${exhibit.user?.username || 'admin'}`} className="text-amber-400 font-pixel text-xs hover:text-amber-500">
        ◀ BACK TO MUSEUM
      </Link>

      <div className="pixel-panel mt-6 overflow-hidden">
        {img && (
          <div className="aspect-video bg-stone-100 border-b-2 border-stone-900">
            <img src={img} alt={exhibit.title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-8">
          <span className="pixel-tag bg-amber-100 text-amber-700 uppercase">{exhibit.type}</span>
          <h1 className="font-serif text-3xl mt-4 text-stone-100 uppercase">{exhibit.title}</h1>
          {exhibit.date && (
            <p className="text-stone-500 text-sm mt-2">{new Date(exhibit.date).toLocaleDateString()}</p>
          )}
          <p className="text-stone-300 mt-6 whitespace-pre-wrap">{exhibit.description}</p>
        </div>
      </div>
    </div>
  );
}
