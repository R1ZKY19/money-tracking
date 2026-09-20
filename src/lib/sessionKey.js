const KEY = 'money_tracking_session_key';

export function getSessionKey() {
  let value = sessionStorage.getItem(KEY);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(KEY, value);
  }
  return value;
}