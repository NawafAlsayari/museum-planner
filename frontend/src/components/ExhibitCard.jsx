import { Link } from 'react-router-dom';

const TYPE_LABEL = {
  PHOTO: 'Photo',
  PROJECT: 'Project',
  ACHIEVEMENT: 'Achievement',
};

const TYPE_TAG = {
  PHOTO: 'bg-sky-100 text-sky-700',
  PROJECT: 'bg-emerald-100 text-emerald-700',
  ACHIEVEMENT: 'bg-amber-100 text-amber-700',
};

export const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ExhibitCard({ exhibit }) {
  const img = exhibit.imageUrl ? `${API_BASE}${exhibit.imageUrl}` : null;

  return (
    <Link
      to={`/exhibits/${exhibit.id}`}
      className="pixel-panel group block overflow-hidden transition hover:-translate-y-1"
    >
      <div className="aspect-[4/3] bg-stone-100 flex items-center justify-center overflow-hidden border-b-2 border-stone-900">
        {img ? (
          <img src={img} alt={exhibit.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-40">
            {exhibit.type === 'PHOTO' ? '📷' : exhibit.type === 'PROJECT' ? '🛠️' : '🏆'}
          </span>
        )}
      </div>
      <div className="p-4">
        <span className={`pixel-tag ${TYPE_TAG[exhibit.type] || 'bg-stone-200 text-stone-600'}`}>
          {TYPE_LABEL[exhibit.type] || exhibit.type}
        </span>
        <h3 className="font-serif text-lg mt-3 text-stone-700 uppercase group-hover:text-amber-400">
          {exhibit.title}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 mt-1">{exhibit.description}</p>
        {exhibit.date && (
          <p className="text-xs text-stone-400 mt-2">{new Date(exhibit.date).toLocaleDateString()}</p>
        )}
      </div>
    </Link>
  );
}
