import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Chat bantuan untuk user yang akunnya terkunci di halaman login (tanpa perlu login).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const message = String(body?.message || '').slice(0, 500);
    const email = String(body?.email || '').slice(0, 120);
    const lockedUntil = String(body?.locked_until || '').slice(0, 60);
    if (!message) return Response.json({ error: 'Pesan kosong' }, { status: 400 });

    const history = Array.isArray(body?.history)
      ? body.history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${String(m.text || '').slice(0, 400)}`).join('\n')
      : '';

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Anda adalah "AI MONEY.T", asisten bantuan login aplikasi MONEY TRACKING.
Konteks: akun user SEDANG TERKUNCI otomatis karena 3x salah kata sandi. Ini penguncian sementara demi keamanan, BUKAN akun dihapus atau diblokir permanen.
Email user: ${email || 'tidak diketahui'}. Kunci terbuka otomatis pada: ${lockedUntil || 'beberapa menit lagi'}.

Aturan menjawab:
- Bahasa Indonesia, ramah, hangat, dan menenangkan. Sapa singkat, jangan kaku.
- Jelas dan ringkas: maksimal 4 kalimat atau poin pendek. Tanpa markdown berat.
- Beri solusi konkret: tunggu sampai kunci terbuka, atau gunakan "Lupa kata sandi?" untuk reset, atau hubungi Admin via WhatsApp 083812595110 jika mendesak.
- JANGAN pernah meminta atau menerima kata sandi user. Jika user menuliskan kata sandinya, ingatkan agar tidak membagikan kata sandi.
- Anda tidak bisa membuka kunci sendiri; jangan menjanjikan pembukaan kunci.
- Jika pertanyaannya di luar urusan login/akses, arahkan sopan untuk bertanya lagi setelah berhasil masuk.

${history ? `Riwayat percakapan:\n${history}\n` : ''}Pertanyaan user: ${message}`,
    });

    return Response.json({ reply: typeof reply === 'string' ? reply : String(reply) });
  } catch (error) {
    console.error('lockedAccountHelp error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}