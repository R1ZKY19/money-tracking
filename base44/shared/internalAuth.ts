// Gerbang untuk fungsi sensitif yang hanya boleh dipanggil oleh workflow internal
// (membawa trigger_key) atau oleh admin/Super Master yang sudah login.
export function isInternalTrigger(body) {
  const key = Deno.env.get('INTERNAL_TRIGGER_KEY');
  return Boolean(key) && String(body?.trigger_key || '') === key;
}

export async function isInternalOrAdmin(base44, body) {
  if (isInternalTrigger(body)) return true;
  const user = await base44.auth.me().catch(() => null);
  return Boolean(user && user.role === 'admin');
}