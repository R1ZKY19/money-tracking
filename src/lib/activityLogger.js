import { supabase } from "@/api/supabaseClient";
import { DEMO_MODE } from '@/components/demo/demoSession';

async function getPublicIP() {
  if (DEMO_MODE) return 'demo-local';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.ip || "unknown";
  } catch {
    return "unknown";
  }
}

let _cachedUserName = null;
let _cacheExpiry = 0;
async function getCurrentUserName() {
  const now = Date.now();
  if (_cachedUserName && now < _cacheExpiry) return _cachedUserName;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      _cachedUserName = profile?.full_name || user.email?.split('@')[0] || 'Pengguna';
      _cacheExpiry = now + 5 * 60 * 1000; // cache 5 menit
    }
    return _cachedUserName || 'Pengguna';
  } catch {
    return _cachedUserName || 'Pengguna';
  }
}

export async function logActivity({ action, module, description, entityId, entityName, oldValue, newValue, status = "success" }) {
  // Fire and forget — non-blocking, tidak block UI
  Promise.all([getPublicIP(), getCurrentUserName()])
    .then(async ([ip, userName]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !DEMO_MODE) return;
      await supabase.from('activity_logs').insert({
        user_id: user?.id || null,
        action,
        entity_type: module,
        entity_id: entityId || null,
        new_data: {
          description: `${userName} ${description}`,
          entity_name: entityName || "",
          old_value: oldValue ? JSON.stringify(oldValue).substring(0, 1000) : "",
          new_value: newValue ? JSON.stringify(newValue).substring(0, 1000) : "",
          status,
        },
        ip_address: ip,
        user_agent: (navigator.userAgent || '').substring(0, 200),
      });
    })
    .catch(() => {}); // silent fail — log tidak boleh crash UI
}

export const logLogin = (email) => logActivity({ action: "login", module: "auth", description: `melakukan Login dengan email ${email}` });
export const logLogout = () => { _cachedUserName = null; return logActivity({ action: "logout", module: "auth", description: "melakukan Logout" }); };
export const logCreate = (module, description) => logActivity({ action: "create", module, description: `menambahkan ${description}` });
export const logUpdate = (module, description, oldVal, newVal) => logActivity({ action: "update", module, description: `mengubah ${description}`, oldValue: oldVal, newValue: newVal });
export const logDelete = (module, description) => logActivity({ action: "delete", module, description: `menghapus ${description}` });
export const logPayment = (module, description) => logActivity({ action: "payment", module, description: `melakukan pembayaran: ${description}` });
export const logView = (module) => logActivity({ action: "view", module, description: `membuka halaman ${module}` });