export function ensureDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'tsume_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
