// Date-only helpers.
//
// The app treats calendar dates (YYYY-MM-DD) as the unit of time for tasks and
// exhibits. Storing those at 12:00 UTC and querying with UTC day boundaries
// keeps a date on the same calendar day across every timezone, instead of
// shifting a day when a browser or server runs in a positive or negative offset.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value) {
  if (typeof value !== 'string') return null;
  const m = DATE_ONLY.exec(value.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

export function isValidDateValue(value) {
  if (value === undefined || value === null || value === '') return true;
  return !Number.isNaN(new Date(value).getTime());
}

// Convert a body/query date into a Date stored at 12:00 UTC for date-only
// strings, or a normal Date for full ISO timestamps. Returns null for empty.
export function toDateTime(value) {
  if (value === undefined || value === null || value === '') return null;
  const p = parseDateOnly(value);
  if (p) {
    return new Date(Date.UTC(p.year, p.month, p.day, 12, 0, 0));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// [start, end) UTC range for a single calendar day.
export function dayRangeUtc(value) {
  const p = parseDateOnly(value);
  if (!p) return null;
  const start = new Date(Date.UTC(p.year, p.month, p.day));
  const end = new Date(Date.UTC(p.year, p.month, p.day + 1));
  return { start, end };
}

// [start, end) UTC range for the week (Monday) containing the given date.
export function weekRangeUtc(value) {
  const p = parseDateOnly(value);
  if (!p) return null;
  const start = new Date(Date.UTC(p.year, p.month, p.day));
  const diff = (start.getUTCDay() + 6) % 7; // days since Monday
  start.setUTCDate(start.getUTCDate() - diff);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

// [start, end) UTC range for the month containing the given date.
export function monthRangeUtc(value) {
  const p = parseDateOnly(value);
  if (!p) return null;
  const start = new Date(Date.UTC(p.year, p.month, 1));
  const end = new Date(Date.UTC(p.year, p.month + 1, 1));
  return { start, end };
}
