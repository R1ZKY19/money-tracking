import { DEMO_MODE, isolatedStorage, demoUnavailable } from '@/components/demo/demoSession';
// Evaluated before importing the application: no real browser storage or API transport in demo.
if (DEMO_MODE) {
  Object.defineProperty(window, 'localStorage', { configurable: true, value: isolatedStorage('local') });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: isolatedStorage('session') });
  window.fetch = async () => demoUnavailable();
  window.XMLHttpRequest.prototype.send = function () { demoUnavailable(); };
  window.WebSocket = class DemoBlockedSocket { constructor() { demoUnavailable(); } };
  window.EventSource = class DemoBlockedEvents { constructor() { demoUnavailable(); } };
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
}