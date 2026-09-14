import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import ExhibitCard from '../components/ExhibitCard.jsx';

const FEATURES = [
  { icon: '📷', title: 'PHOTOS', desc: 'Remember important moments and places.' },
  { icon: '🛠️', title: 'PROJECTS', desc: 'Showcase what you have built and are building.' },
  { icon: '🏆', title: 'ACHIEVEMENTS', desc: 'Celebrate milestones and wins.' },
];

export default function Home() {
  const [museum, setMuseum] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/museum/admin')
      .then((res) => setMuseum(res.data))
      .catch(() => setError('Museum not found. Try /museum/:username.'));
  }, []);

  return (
    <div>
      <section className="bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <p className="text-amber-400 font-pixel text-[0.65rem] tracking-widest mb-4">A PERSONAL DIGITAL GALLERY</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-stone-100 uppercase">
            My Museum &amp; Planner
          </h1>
          <p className="mt-4 text-stone-400 max-w-2xl mx-auto">
            A curated space for photos, projects, and achievements — plus a daily, weekly, and monthly task planner.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/museum/admin" className="pixel-btn">
              VISIT THE MUSEUM
            </Link>
            <Link
              to="/login"
              className="pixel-btn pixel-btn--secondary"
            >
              OPEN DASHBOARD
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-stone-100 uppercase">Featured Exhibits</h2>
          <Link to="/museum/admin" className="text-amber-400 text-sm font-pixel hover:text-amber-500">
            VIEW ALL →
          </Link>
        </div>

        {error && <p className="text-stone-500">{error}</p>}

        {museum && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {museum.exhibits.slice(0, 3).map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t-4 border-amber-600">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="pixel-panel p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="font-pixel text-stone-100 text-xs mt-3 uppercase">{f.title}</h3>
              <p className="text-stone-500 text-sm mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
