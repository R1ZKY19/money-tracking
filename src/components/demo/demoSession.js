const nativeSession = window.sessionStorage;
const modeKey = 'moneyt.demo.active.v1';
export const DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1' || nativeSession.getItem(modeKey) === '1';
export const DEMO_PREFIX = 'moneyt.demo.v1:';
if (DEMO_MODE) nativeSession.setItem(modeKey, '1');
export function startDemo() {
  nativeSession.setItem(modeKey, '1');
  window.location.assign('/?demo=1');
}
export function exitDemo() {
  nativeSession.removeItem(modeKey);
  window.location.assign('/login');
}
export function resetDemo() {
  Object.keys(nativeSession).filter(key => key.startsWith(DEMO_PREFIX)).forEach(key => nativeSession.removeItem(key));
  window.location.assign('/?demo=1');
}
export function isolatedStorage(area) {
  const prefix = `${DEMO_PREFIX}${area}:`;
  const keys = () => Object.keys(nativeSession).filter(key => key.startsWith(prefix));
  return {
    get length() { return keys().length; },
    key: index => keys()[index]?.slice(prefix.length) ?? null,
    getItem: key => nativeSession.getItem(prefix + key),
    setItem: (key, value) => nativeSession.setItem(prefix + key, String(value)),
    removeItem: key => nativeSession.removeItem(prefix + key),
    clear: () => keys().forEach(key => nativeSession.removeItem(key)),
  };
}
export function demoUnavailable() {
  const message = 'DEMO MODE: layanan eksternal tidak dijalankan. Tidak ada data yang dikirim atau diambil dari production.';
  window.dispatchEvent(new CustomEvent('moneyt:demo-notice', { detail: message }));
  throw new Error(message);
}