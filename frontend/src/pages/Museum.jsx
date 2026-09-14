import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';
import ExhibitCard from '../components/ExhibitCard.jsx';

const FILTERS = ['ALL', 'PHOTO', 'PROJECT', 'ACHIEVEMENT'];

export default function Museum() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api
      .get(`/api/museum/${username}`)
      .then((res) => setData(res.data))
      .catch(() => setError('This museum could not be found.'));
  }, [username]);

  if (error) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-500">{error}</div>;
  }

  if (!data) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-500">Loading museum…</div>;
  }

  const exhibits = filter === 'ALL' ? data.exhibits : data.exhibits.filter((e) => e.type === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <p className="text-amber-400 font-pixel text-[0.6rem] tracking-widest uppercase">Museum</p>
        <h1 className="font-serif text-4xl mt-2 text-stone-700 uppercase">{data.museum.displayName}</h1>
        <p className="text-stone-500 mt-2">
          @{data.museum.username} · {data.exhibits.length} exhibit{data.exhibits.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="flex justify-center gap-3 mb-10 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pixel-btn ${filter === f ? '' : 'pixel-btn--secondary'}`}
          >
            {f === 'ALL' ? 'ALL' : f}
          </button>
        ))}
      </div>

      {exhibits.length === 0 ? (
        <p className="text-center text-stone-500 py-12">No exhibits in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibits.map((exhibit) => (
            <ExhibitCard key={exhibit.id} exhibit={exhibit} />
          ))}
        </div>
      )}
    </div>
  );
}
