import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import UsageSessionDetails from '@/components/settings/UsageSessionDetails';
import {
  Crown, Gem, Star, Users, Shield, Lock, Clock,
  Monitor, Smartphone, Activity, CheckCircle2, AlertCircle,
  Calendar, Zap, X, Loader2, Wifi, WifiOff, RefreshCw,
  LayoutDashboard, Globe, Eye
} from 'lucide-react';

const ROLES_META = {
  super_master: { label: 'SUPER MASTER', icon: Crown, gradient: 'linear-gradient(135deg, #F59E0B, #D97706, #92400E)', accent: '#D97706', glow: '0 0 30px rgba(217,119,6,0.3)', stars: 5, tier: 'ULTIMATE' },
  master_1:     { label: 'MASTER I',     icon: Gem,   gradient: 'linear-gradient(135deg, #818CF8, #6366F1, #3730A3)', accent: '#4F46E5', glow: '0 0 30px rgba(99,102,241,0.3)', stars: 4, tier: 'PREMIUM' },
  master_2:     { label: 'MASTER II',    icon: Star,  gradient: 'linear-gradient(135deg, #22D3EE, #0891B2, #0E7490)', accent: '#0891B2', glow: null, stars: 3, tier: 'STANDAR' },
  staf:         { label: 'STAF',         icon: Users, gradient: 'linear-gradient(135deg, #34D399, #10B981, #059669)', accent: '#059669', glow: null, stars: 2, tier: 'DASAR' },
  admin:        { label: 'ADMIN',        icon: Shield,gradient: 'linear-gradient(135deg, #F87171, #EF4444, #DC2626)', accent: '#DC2626', glow: null, stars: 3, tier: 'ADMIN' },
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return { text: 'Baru saja', color: 'text-emerald-500', isOnline: true,  isDashboard: true };
  if (mins < 5)   return { text: `${mins} menit lalu`, color: 'text-emerald-500', isOnline: true,  isDashboard: true };
  if (mins < 30)  return { text: `${mins} menit lalu`, color: 'text-amber-500',   isOnline: true,  isDashboard: false };
  if (hours < 1)  return { text: `${mins} menit lalu`, color: 'text-orange-500',  isOnline: false, isDashboard: false };
  if (hours < 24) return { text: `${hours} jam lalu`,  color: 'text-orange-600',  isOnline: false, isDashboard: false };
  if (days < 7)   return { text: `${days} hari lalu`,  color: 'text-muted-foreground', isOnline: false, isDashboard: false };
  return { text: `${days} hari lalu`, color: 'text-muted-foreground', isOnline: false, isDashboard: false };
}

function getDeviceType(ua) {
  if (!ua) return { type: 'Unknown', icon: Monitor };
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return { type: 'Mobile', icon: Smartphone };
  return { type: 'Desktop', icon: Monitor };
}

function getBrowser(ua) {
  if (!ua) return '—';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua)) return 'Safari';
  if (/Opera|OPR\//i.test(ua)) return 'Opera';
  return 'Browser Lain';
}

function getOS(ua) {
  if (!ua) return '—';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iOS|iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function StarRow({ count, accent }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} style={{ color: i < count ? accent : '#E5E7EB' }} fill={i < count ? accent : '#E5E7EB'} />
      ))}
    </div>
  );
}

export default function MemberProfileModal({ member, open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usage, setUsage] = useState({});
  const [error, setError] = useState('');
  const requestRef = useRef(0);
  const intervalRef = useRef(null);
  const [tick, setTick] = useState(0); // force re-render for live relative time

  const fetchLogs = async (m) => {
    if (!m) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const { data: sessions } = await supabase.from('usage_sessions').select('*').eq('user_email', m.email).order('started_at', { ascending: false }).limit(10); const response = { data: { sessions: sessions || [] } };
      if (requestId !== requestRef.current) return;
      setUsage(response.data || {});
      setError('');
      setLogs(response.data?.logs || []);
      setSessions(response.data?.sessions || []);
      setLastRefreshed(new Date());
    } catch {
      if (requestId === requestRef.current) { setError('Gagal memuat detail staf'); setLogs([]); setSessions([]); setUsage({}); }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !member) {
      clearInterval(intervalRef.current);
      return;
    }
    fetchLogs(member);
    // Auto-refresh setiap 30 detik
    intervalRef.current = setInterval(() => fetchLogs(member), 30000);
    return () => { requestRef.current++; clearInterval(intervalRef.current); };
  }, [open, member]);

  // Live relative time — re-render setiap 10 detik
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTick(x => x + 1), 10000);
    return () => clearInterval(t);
  }, [open]);

  if (!member) return null;

  const cfg = ROLES_META[member.role || 'staf'] || ROLES_META['staf'];
  const Icon = cfg.icon;
  const isPremium = member.role === 'super_master' || member.role === 'master_1';

  const lastLog    = logs[0];
  const loginLogs  = logs.filter(l => l.action === 'login');
  const deviceAgent = sessions[0]?.user_agent || lastLog?.user_agent;
  const lastLogin  = loginLogs[0];

  const lastActiveTime = timeAgo(lastLog?.created_date);
  const lastLoginTime  = timeAgo(lastLogin?.created_date);
  const device = getDeviceType(sessions[0]?.user_agent || lastLog?.user_agent);
  const DeviceIcon = device.icon;

  // Dashboard open: active log within 5 mins AND module is not 'auth'
  const isDashboardOpen = sessions.some(s => s.is_active && Date.now() - new Date(s.last_seen).getTime() < 90000);
  const isOnline = isDashboardOpen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        <DialogTitle className="sr-only">Detail staf {member.email}</DialogTitle>

        {/* Header */}
        <div className="relative h-28 overflow-hidden" style={{ background: cfg.gradient }}>
          {isPremium && (
            <div className="absolute inset-0 opacity-25"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmerSlide 3s ease-in-out infinite' }} />
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors z-10">
            <X size={14} className="text-white" />
          </button>

          {/* Avatar */}
          <div className="absolute left-5 bottom-[-24px] w-14 h-14 rounded-2xl border-3 shadow-xl overflow-hidden flex items-center justify-center"
            style={{ background: cfg.gradient, border: '3px solid white' }}>
            <Icon size={24} className="text-white" />
          </div>

          {/* Live status badges — top right area */}
          <div className="absolute right-12 top-3 flex items-center gap-1.5">
            {/* Dashboard open status */}
            {isDashboardOpen ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/80 text-white">
                <LayoutDashboard size={9} className="animate-pulse" /> Buka Dashboard
              </span>
            ) : null}
            {/* Online/Offline */}
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/25 text-white/80">
                <WifiOff size={9} /> Offline
              </span>
            )}
          </div>

          {/* Role label */}
          <div className="absolute left-24 bottom-3">
            <p className="text-white font-black text-sm">{cfg.label}</p>
            <p className="text-white/70 text-[10px]">{cfg.tier}</p>
          </div>
        </div>

        {/* Body */}
        <div className="pt-9 px-5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Email + meta */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground truncate">{member.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StarRow count={cfg.stars} accent={cfg.accent} />
                {member.email === 'rizkykucuk19@gmail.com' && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200">
                    <Lock size={7} /> Owner
                  </span>
                )}
                {member.approved_at && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar size={9} /> {new Date(member.approved_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {member.notes && <p className="text-[11px] text-muted-foreground italic mt-0.5">"{member.notes}"</p>}
            </div>
            {/* Live refresh button */}
            <button onClick={() => fetchLogs(member)} disabled={loading}
              className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              Live
            </button>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}. Tekan Live untuk mencoba lagi.</p>}
          {/* Last refreshed */}
          {lastRefreshed && (
            <p className="text-[9px] text-muted-foreground/60">
              Diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')} · auto-refresh 30 detik
            </p>
          )}

          {/* Status cards grid */}
          <div className="grid grid-cols-2 gap-2.5">

            {/* Aktivitas Terakhir */}
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity size={11} className={lastActiveTime?.color || 'text-muted-foreground'} />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Aktivitas Terakhir</p>
              </div>
              {loading ? <Loader2 size={13} className="animate-spin text-muted-foreground" /> : lastLog ? (
                <>
                  <p className={`text-sm font-bold ${lastActiveTime?.color}`}>{lastActiveTime?.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{lastLog.action} · {lastLog.module}</p>
                </>
              ) : <p className="text-xs text-muted-foreground italic">Belum ada log</p>}
            </div>

            {/* Status Login */}
            <div className={`rounded-xl border p-3 ${isOnline ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center gap-1.5 mb-2">
                {isOnline
                  ? <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status Login</p>
              </div>
              {loading ? <Loader2 size={13} className="animate-spin text-muted-foreground" /> : (
                <>
                  <p className={`text-sm font-bold ${isOnline ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {isOnline ? 'Sedang Online' : 'Offline'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isDashboardOpen ? '📊 Dashboard terbuka' : lastLogin ? `Login: ${lastLoginTime?.text}` : 'Belum pernah login'}
                  </p>
                </>
              )}
            </div>

            {/* IP Address */}
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Wifi size={11} className="text-sky-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">IP Terakhir</p>
              </div>
              {loading ? <Loader2 size={13} className="animate-spin text-muted-foreground" /> : lastLog?.ip_address && lastLog.ip_address !== 'unknown' ? (
                <>
                  <p className="text-sm font-bold text-foreground font-mono">{lastLog.ip_address}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getOS(lastLog.user_agent)}</p>
                </>
              ) : <p className="text-xs text-muted-foreground italic">Tidak tersedia</p>}
            </div>

            {/* Device & Browser */}
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <DeviceIcon size={11} className="text-violet-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Perangkat</p>
              </div>
              {loading ? <Loader2 size={13} className="animate-spin text-muted-foreground" /> : deviceAgent ? (
                <>
                  <p className="text-sm font-bold text-foreground">{device.type}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getBrowser(deviceAgent)} · {getOS(deviceAgent)}</p>
                </>
              ) : <p className="text-xs text-muted-foreground italic">Tidak tersedia</p>}
            </div>
          </div>

          {!loading && !error && <UsageSessionDetails sessions={sessions} totalSeconds={usage.total_seconds} sessionCount={usage.session_count} profile={usage.profile} />}

          {/* Login counter */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border"
            style={{ background: cfg.accent + '08' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cfg.accent + '20' }}>
              <Zap size={16} style={{ color: cfg.accent }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Total Login Tercatat</p>
              <p className="text-[10px] text-muted-foreground">{loginLogs.length} kali login dalam riwayat log</p>
            </div>
            <p className="text-2xl font-black" style={{ color: cfg.accent }}>{loginLogs.length}</p>
          </div>

          {/* Recent logs */}
          {!loading && logs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Riwayat Aktivitas Terbaru</p>
                <span className="text-[9px] text-muted-foreground">{logs.length} entri</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {logs.slice(0, 15).map((log, i) => {
                  const t = timeAgo(log.created_date);
                  return (
                    <div key={log.id || i} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: log.status === 'success' ? '#10B981' : log.status === 'failed' ? '#EF4444' : '#F59E0B' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate">{log.description}</p>
                        <p className={`text-[9px] mt-0.5 ${t?.color || 'text-muted-foreground'}`}>{t?.text} · {log.module}</p>
                      </div>
                      {log.ip_address && log.ip_address !== 'unknown' && (
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">{log.ip_address}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center py-5 text-center">
              <AlertCircle size={24} className="text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas untuk email ini.</p>
              <p className="text-[10px] text-muted-foreground mt-1 opacity-60">Log dicatat saat user aktif menggunakan aplikasi.</p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes shimmerSlide {
            0% { transform: translateX(-120%); }
            60% { transform: translateX(320%); }
            100% { transform: translateX(320%); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}