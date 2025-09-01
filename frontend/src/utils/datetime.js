// local "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:ss.sssZ" (UTC)
export function toUtcIso(localDateTimeString) {
  return new Date(localDateTimeString).toISOString();
}

// ISO (UTC) -> value for <input type="datetime-local"> in the user's local time
export function toLocalInputValue(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
