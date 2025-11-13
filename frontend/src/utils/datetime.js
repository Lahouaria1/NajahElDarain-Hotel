// src/utils/datetime.js
export function toUtcIso(localDateTimeString) {
  if (!localDateTimeString) throw new Error('toUtcIso: empty input');
  const d = new Date(localDateTimeString);
  if (isNaN(d.getTime())) throw new Error('toUtcIso: invalid datetime');
  return d.toISOString();
}

export function toLocalInputValue(isoOrDate) {
  if (!isoOrDate) throw new Error('toLocalInputValue: empty input');
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) throw new Error('toLocalInputValue: invalid date');

  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
