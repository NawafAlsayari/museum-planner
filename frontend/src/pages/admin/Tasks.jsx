import { useEffect, useState, useCallback } from 'react';
import api from '../../api.js';

const VIEWS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Tasks() {
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState(fmt(startOfDay(new Date())));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/tasks?view=${view}&date=${fmt(date)}`);
      setTasks(res.data.tasks);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [view, date]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftDate(delta) {
    const d = new Date(date);
    if (view === 'daily') d.setDate(d.getDate() + delta);
    else if (view === 'weekly') d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setDate(d);
    setNewDue(fmt(d));
  }

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/api/tasks', { title: newTitle.trim(), dueDate: newDue });
      setNewTitle('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add task');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(task) {
    try {
      await api.patch(`/api/tasks/${task.id}`, { completed: !task.completed });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  }

  const byDay = {};
  tasks.forEach((t) => {
    const key = toDateKey(new Date(t.dueDate));
    (byDay[key] = byDay[key] || []).push(t);
  });

  const weekDays = [];
  if (view === 'weekly') {
    const start = new Date(date);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekDays.push(d);
    }
  }

  const monthCells = [];
  if (view === 'monthly') {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < startPad; i++) monthCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) monthCells.push(new Date(year, month, d));
    while (monthCells.length % 7 !== 0) monthCells.push(null);
  }

  function renderTaskLine(task) {
    return (
      <li key={task.id} className="flex items-start gap-3 py-2 border-b-2 border-stone-900 last:border-0">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggle(task)}
          className="mt-1 h-4 w-4 accent-amber-500"
        />
        <div className="flex-1">
          <span className={task.completed ? 'line-through text-stone-500' : 'text-stone-600'}>{task.title}</span>
          <span className="text-xs text-stone-500 ml-2">{fmt(new Date(task.dueDate))}</span>
        </div>
        <button onClick={() => remove(task.id)} className="text-xs text-red-500 hover:text-red-400 font-pixel text-[0.5rem]">
          DEL
        </button>
      </li>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-pixel text-stone-700 text-xs uppercase">Tasks</h2>
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`pixel-btn text-[0.5rem] ${view === v.key ? '' : 'pixel-btn--secondary'}`}
            >
              {v.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="pixel-panel p-4 mb-6 flex items-center gap-3 flex-wrap">
        <button onClick={() => shiftDate(-1)} className="pixel-btn pixel-btn--secondary text-[0.6rem]">
          ◀
        </button>
        <input
          type="date"
          value={fmt(date)}
          onChange={(e) => {
            setDate(new Date(e.target.value));
            setNewDue(e.target.value);
          }}
          className="pixel-input text-sm"
        />
        <button onClick={() => shiftDate(1)} className="pixel-btn pixel-btn--secondary text-[0.6rem]">
          ▶
        </button>
        <span className="text-sm text-stone-400 ml-auto">
          {view === 'monthly'
            ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
            : date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border-2 border-stone-900">{error}</div>}

      <form onSubmit={addTask} className="pixel-panel p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title…"
          className="flex-1 pixel-input"
        />
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className="pixel-input" />
        <button type="submit" disabled={saving} className="pixel-btn text-[0.5rem]">
          {saving ? '…' : 'ADD'}
        </button>
      </form>

      {loading && <p className="text-stone-500">Loading…</p>}

      {!loading && view === 'daily' && (
        <div className="pixel-panel p-4">
          {tasks.length === 0 ? (
            <p className="text-stone-500 text-sm">No tasks for this day.</p>
          ) : (
            <ul>{tasks.map(renderTaskLine)}</ul>
          )}
        </div>
      )}

      {!loading && view === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const key = toDateKey(d);
            const dayTasks = byDay[key] || [];
            return (
              <div key={key} className="pixel-panel p-3">
                <p className="font-pixel text-stone-400 text-[0.5rem] mb-2 uppercase">
                  {d.toLocaleDateString(undefined, { weekday: 'short' })} {d.getDate()}
                </p>
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-stone-600">—</p>
                ) : (
                  <ul className="text-sm">{dayTasks.map(renderTaskLine)}</ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && view === 'monthly' && (
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center font-pixel text-stone-400 text-[0.5rem] py-1 uppercase">
              {d}
            </div>
          ))}
          {monthCells.map((d, i) =>
            d ? (
              <div
                key={toDateKey(d)}
                className={`min-h-24 p-2 cursor-pointer ${
                  toDateKey(d) === fmt(date)
                    ? 'pixel-panel ring-2 ring-amber-500'
                    : 'pixel-panel'
                }`}
                onClick={() => setDate(d)}
              >
                <p className="font-pixel text-stone-400 text-[0.5rem]">{d.getDate()}</p>
                <div className="mt-1 space-y-1">
                  {(byDay[toDateKey(d)] || []).map((t) => (
                    <div key={t.id} className={`text-xs truncate ${t.completed ? 'line-through text-stone-500' : 'text-stone-600'}`}>
                      <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} className="mr-1 accent-amber-500" />
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={i} className="min-h-24 bg-stone-900" />
            )
          )}
        </div>
      )}
    </div>
  );
}
