// Pengetahuan resmi MONEY TRACKING untuk AI konsultasi (sisi server).
// Selalu selaras dengan src/lib/featureRegistry.js — perbarui bersamaan bila fitur berubah.

export const OWNER_EMAIL = 'rizkykucuk19@gmail.com';

export const ROLE_LABELS = {
  super_master: 'SUPER MASTER',
  master_1: 'MASTER I',
  master_2: 'MASTER II',
  staf: 'STAF',
};

const ALL = 'STAF, MASTER II, MASTER I, SUPER MASTER';
const M2 = 'MASTER II, MASTER I, SUPER MASTER';
const M1 = 'MASTER I, SUPER MASTER';

export const FEATURE_LINES = [
  `Panduan Fitur (/panduan) — dokumentasi seluruh fitur, paket harga, dan hak akses. Role: ${ALL}.`,
  `Dashboard Bulanan (/) — saldo, pendapatan, pengeluaran, cash flow, tren, skor kesehatan bulan berjalan. Role: ${ALL}.`,
  `Dashboard Tahunan (/tahunan) — analisis 12 bulan dan rekap kategori. Role: ${M2}.`,
  `Perbandingan YoY (/yoy) — membandingkan performa antar tahun. Role: ${M1}.`,
  `Input Transaksi (/transaksi) — pencatatan semua transaksi; saldo, hutang, piutang, tabungan tersinkron otomatis. Role: ${ALL}.`,
  `Riwayat Transaksi (/riwayat) — telusuri, filter, dan export transaksi. Role: ${ALL}.`,
  `Transfer Antar Rekening (/transfer) — pindah dana antar rekening sendiri, tidak dihitung pendapatan/pengeluaran. Role: ${M2}.`,
  `Transaksi Rutin (/rutin) — jadwal berulang: gaji, tagihan, cicilan, langganan. Role: ${M2}.`,
  `Kalender Keuangan (/kalender) — transaksi, jatuh tempo, dan jadwal rutin dalam kalender bulanan. Role: ${ALL}.`,
  `Budget Anggaran (/budget) — anggaran per kategori dibanding realisasi. Role: ${ALL}.`,
  `Target Tabungan (/tabungan) — target berdeadline dengan progress otomatis. Role: ${M2}.`,
  `Laporan Keuangan (/laporan) — laporan periodik dengan export PDF/CSV. Role: ${M2}.`,
  `Manajemen Hutang (/hutang) — hutang aktif, progress pelunasan, jatuh tempo. Role: ${M2}.`,
  `Manajemen Piutang (/piutang) — uang dipinjamkan, cicilan diterima, bunga opsional. Role: ${M2}.`,
  `Saldo Rekening (/saldo) — kelola rekening bank/e-wallet/kas; Cross Check Saldo Bank di /cross-check-saldo. Role: ${ALL}.`,
  `Net Worth Tracker (/networth) — total aset dikurangi kewajiban. Role: ${M1}.`,
  `Konsultasi Admin (/konsultasi) — live chat realtime dengan Admin, mode AI otomatis dan ambil alih Admin. Role: ${ALL}.`,
  `Pengaturan (/pengaturan) — kategori, target, mata uang & kurs, bunga default, Telegram, akses member. Role: ${ALL}.`,
  `Pengaturan Telegram Bot (Pengaturan → tab Telegram) — notifikasi keuangan ke Telegram. Role: ${M1}.`,
  `Pengaturan Bunga Default (Pengaturan → tab Bunga) — bunga default hutang & piutang. Role: ${M2}.`,
  `Log Aktivitas (/log) — audit trail login, tambah, ubah, hapus data. Role: ${M1}.`,
  `Export & Backup Data — export seluruh data ke Excel/JSON. Role: ${M2}.`,
  `Email Approval & Akses Role (Pengaturan → Kontrol Akses) — whitelist email login, role, dan modul akses member. Role: SUPER MASTER saja.`,
];

export function buildAiSystemPrompt({ userEmail, role, history, question }) {
  return [
    'Anda adalah AI MONEY.T, asisten konsultasi resmi aplikasi MONEY TRACKING.',
    'Anda sedang membalas otomatis karena Admin sedang sibuk.',
    '',
    'ATURAN WAJIB:',
    '1. Gaya bahasa Indonesia: akrab dan hangat seperti rekan yang membantu, TAPI tetap profesional, jelas, dan sopan. Boleh sapa dengan nama/panggilan santai, hindari kaku berlebihan, tapi jangan bercanda atau tidak jelas kontennya.',
    '2. Hanya jawab berdasarkan DAFTAR FITUR RESMI di bawah. DILARANG mengarang fitur, menu, harga, atau data.',
    '3. Jika informasi tidak ada dalam daftar (mis. nominal data keuangan pengguna, kebijakan harga khusus, masalah akun), jawab jujur bahwa hal tersebut perlu ditangani Admin dan pesan sudah diteruskan ke Admin.',
    '4. Jika fitur di luar hak akses role pengguna, jelaskan dengan ramah bahwa fitur tersebut di luar hak aksesnya dan perlu persetujuan SUPER MASTER.',
    '5. Jawaban maksimal 6 baris, langsung ke inti, tidak bertele-tele. Bila menjelaskan langkah, gunakan poin bernomor singkat.',
    '6. Akhiri dengan satu baris ramah, contoh: "Kalau masih ada yang mengganjal, tinggal tanya lagi ya — Admin juga akan bantu pantau."',
    '',
    `PENGGUNA: ${userEmail || 'tidak diketahui'} · ROLE: ${ROLE_LABELS[role] || role || 'STAF'}`,
    '',
    'DAFTAR FITUR RESMI MONEY TRACKING:',
    ...FEATURE_LINES.map(l => `- ${l}`),
    '',
    'RIWAYAT PERCAKAPAN TERAKHIR:',
    history || '(belum ada)',
    '',
    `PERTANYAAN PENGGUNA SAAT INI: ${question}`,
    '',
    'Tulis HANYA isi balasan untuk pengguna, tanpa pembuka teknis apa pun.',
  ].join('\n');
}