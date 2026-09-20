import {
  LayoutDashboard, Calendar, TrendingUp, List, History, ArrowRightLeft, Repeat,
  CalendarDays, ClipboardList, PiggyBank, FileText, CreditCard, HandCoins,
  Landmark, Settings, Send, Percent, Shield, FileDown, LogIn, BookOpen, MessageCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// SUMBER TUNGGAL SELURUH FITUR MONEY TRACKING.
// Tambah / ubah / hapus fitur DI SINI saja — Sidebar, Menu Mobile, Panduan
// Fitur, Akses Role (Super Master), guard URL, dan pengetahuan AI otomatis
// ikut tersinkron karena semuanya membaca daftar ini.
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_ROLES = ['super_master', 'master_1', 'master_2', 'staf'];
const M2 = ['super_master', 'master_1', 'master_2'];
const M1 = ['super_master', 'master_1'];

export const FEATURE_REGISTRY = [
  {
    key: 'Panduan', label: 'Panduan Fitur', route: '/panduan', group: 'Dashboard',
    icon: BookOpen, roles: ALL_ROLES,
    fungsi: 'Dokumentasi resmi seluruh fitur MONEY TRACKING beserta paket harga dan hak akses per role.',
    cara: ['Buka menu Panduan Fitur.', 'Gunakan kolom pencarian untuk menemukan fitur tertentu.', 'Klik kartu fitur untuk membuka panduan langkah demi langkah.'],
    manfaat: 'Semua cara pakai fitur tersedia tanpa perlu bertanya ke admin.',
  },
  {
    key: 'Dashboard Bulanan', label: 'Dashboard Bulanan', route: '/', group: 'Dashboard',
    icon: LayoutDashboard, guideId: 'dashboard-bulanan', roles: ALL_ROLES,
    fungsi: 'Pusat kendali keuangan bulan berjalan: saldo, pendapatan, pengeluaran, cash flow, tren, dan skor kesehatan.',
    cara: ['Buka Dashboard (tampil otomatis saat login).', 'Pilih tahun & bulan pada filter.', 'Baca KPI lalu scroll untuk grafik dan insight.'],
    manfaat: 'Kondisi keuangan bulan ini terbaca dalam hitungan detik.',
  },
  {
    key: 'Dashboard Tahunan', label: 'Dashboard Tahunan', route: '/tahunan', group: 'Dashboard',
    icon: Calendar, guideId: 'dashboard-tahunan', roles: M2,
    fungsi: 'Analisis performa keuangan 12 bulan dalam satu tahun beserta rekap kategori.',
    cara: ['Buka Dashboard Tahunan.', 'Pilih tahun.', 'Baca bar chart dan tabel rekap per bulan.'],
    manfaat: 'Evaluasi setahun penuh untuk perencanaan tahun berikutnya.',
  },
  {
    key: 'YoY Comparison', label: 'Perbandingan YoY', route: '/yoy', group: 'Dashboard',
    icon: TrendingUp, roles: M1,
    fungsi: 'Membandingkan performa keuangan antar tahun (Year over Year).',
    cara: ['Buka Perbandingan YoY.', 'Pilih dua tahun yang ingin dibandingkan.', 'Baca selisih dan persentase pertumbuhan.'],
    manfaat: 'Terlihat apakah kondisi keuangan membaik dibanding tahun lalu.',
  },
  {
    key: 'Input Transaksi', label: 'Input Transaksi', route: '/transaksi', group: 'Transaksi',
    icon: List, guideId: 'transaksi', roles: ALL_ROLES,
    fungsi: 'Pencatatan seluruh aktivitas keuangan; saldo, hutang, piutang, dan tabungan tersinkron otomatis.',
    cara: ['Klik "+ Tambah Transaksi".', 'Pilih jenis transaksi.', 'Isi tanggal, rekening, kategori, nominal, deskripsi.', 'Simpan — data terkait ikut terupdate.'],
    manfaat: 'Satu pencatatan, semua modul keuangan ikut akurat.',
  },
  {
    key: 'Riwayat Transaksi', label: 'Riwayat Transaksi', route: '/riwayat', group: 'Transaksi',
    icon: History, roles: ALL_ROLES,
    fungsi: 'Menelusuri, memfilter, dan menganalisis seluruh transaksi yang pernah dicatat.',
    cara: ['Buka Riwayat Transaksi.', 'Gunakan filter periode, jenis, kategori, rekening, atau pencarian.', 'Export bila perlu arsip.'],
    manfaat: 'Audit cepat setiap catatan keuangan.',
  },
  {
    key: 'Transfer', label: 'Transfer Antar Rekening', route: '/transfer', group: 'Transaksi',
    icon: ArrowRightLeft, guideId: 'transfer', roles: M2,
    fungsi: 'Mencatat pemindahan dana antar rekening sendiri tanpa dihitung sebagai pendapatan/pengeluaran.',
    cara: ['Buka Transfer.', 'Pilih rekening asal dan tujuan (harus berbeda).', 'Isi nominal & tanggal lalu konfirmasi.'],
    manfaat: 'Mutasi internal tercatat tanpa merusak laporan laba/pengeluaran.',
  },
  {
    key: 'Transaksi Rutin', label: 'Transaksi Rutin', route: '/rutin', group: 'Transaksi',
    icon: Repeat, roles: M2,
    fungsi: 'Menjadwalkan transaksi berulang seperti gaji, tagihan, cicilan, dan langganan.',
    cara: ['Klik "Tambah Jadwal".', 'Isi nama, jenis, nominal, rekening, frekuensi, dan tanggal mulai.', 'Aktifkan jadwal; sistem mencatat otomatis saat jatuh waktunya.'],
    manfaat: 'Tidak ada tagihan atau pemasukan rutin yang terlupa dicatat.',
  },
  {
    key: 'Kalender', label: 'Kalender Keuangan', route: '/kalender', group: 'Transaksi',
    icon: CalendarDays, roles: ALL_ROLES,
    fungsi: 'Menampilkan transaksi, jatuh tempo hutang/piutang, dan jadwal rutin dalam satu kalender bulanan.',
    cara: ['Buka Kalender Keuangan.', 'Geser bulan dengan tombol navigasi.', 'Klik tanggal untuk melihat detail agenda hari itu.'],
    manfaat: 'Perencanaan arus kas harian menjadi visual dan mudah.',
  },
  {
    key: 'Budget', label: 'Budget Anggaran', route: '/budget', group: 'Manajemen',
    icon: ClipboardList, guideId: 'budget', roles: ALL_ROLES,
    fungsi: 'Menyusun anggaran per kategori dan membandingkannya dengan realisasi pengeluaran.',
    cara: ['Pilih bulan & tahun.', 'Klik ikon pensil pada kategori lalu isi nominal budget.', 'Pantau progress bar realisasi.'],
    manfaat: 'Pengeluaran terkendali berdasarkan rencana, bukan reaksi.',
  },
  {
    key: 'Tabungan', label: 'Target Tabungan', route: '/tabungan', group: 'Manajemen',
    icon: PiggyBank, guideId: 'tabungan', roles: M2,
    fungsi: 'Membuat target keuangan berdeadline dengan progress otomatis dari transaksi tabungan.',
    cara: ['Buat target: nama, nominal, mata uang, tenggat.', 'Setor melalui Input Transaksi jenis Tabungan.', 'Pantau progress dan estimasi tercapai.'],
    manfaat: 'Tujuan finansial terukur dan terlihat perkembangannya.',
  },
  {
    key: 'Laporan', label: 'Laporan Keuangan', route: '/laporan', group: 'Manajemen',
    icon: FileText, roles: M2,
    fungsi: 'Menyusun laporan keuangan periodik lengkap dengan export PDF/CSV.',
    cara: ['Buka Laporan Keuangan.', 'Pilih periode dan mata uang.', 'Klik Export untuk PDF atau CSV.'],
    manfaat: 'Laporan siap pakai untuk evaluasi maupun arsip.',
  },
  {
    key: 'Hutang', label: 'Manajemen Hutang', route: '/hutang', group: 'Keuangan',
    icon: CreditCard, guideId: 'hutang', roles: M2,
    fungsi: 'Memantau hutang aktif, progress pelunasan, dan tanggal jatuh tempo.',
    cara: ['Buat hutang melalui Input Transaksi jenis Hutang Baru.', 'Pantau daftar di menu Hutang.', 'Bayar melalui jenis Bayar Hutang.'],
    manfaat: 'Seluruh kewajiban terlihat sebelum jatuh tempo.',
  },
  {
    key: 'Piutang', label: 'Manajemen Piutang', route: '/piutang', group: 'Keuangan',
    icon: HandCoins, guideId: 'piutang', roles: M2,
    fungsi: 'Mencatat uang yang dipinjamkan beserta penerimaan cicilan dan bunga opsional.',
    cara: ['Buat piutang melalui Input Transaksi jenis Piutang Baru.', 'Pantau di menu Piutang.', 'Catat penerimaan lewat jenis Terima Piutang.'],
    manfaat: 'Tidak ada tagihan ke pihak lain yang terlupakan.',
  },
  {
    key: 'Saldo Rekening', label: 'Saldo Rekening', route: '/saldo', group: 'Keuangan',
    icon: Landmark, guideId: 'saldo', roles: ALL_ROLES,
    fungsi: 'Mengelola seluruh rekening bank, e-wallet, dan kas dengan saldo real-time; termasuk Cross Check Saldo Bank di /cross-check-saldo.',
    cara: ['Tambah akun beserta saldo awal.', 'Saldo terupdate otomatis dari setiap transaksi.', 'Gunakan Cross Check untuk membandingkan saldo sistem vs saldo bank aktual.'],
    manfaat: 'Selisih pencatatan cepat terdeteksi dan bisa ditelusuri.',
  },
  {
    key: 'Net Worth', label: 'Net Worth Tracker', route: '/networth', group: 'Keuangan',
    icon: TrendingUp, roles: M1,
    fungsi: 'Menghitung kekayaan bersih: total aset dikurangi total kewajiban.',
    cara: ['Buka Net Worth Tracker.', 'Baca komposisi aset dan kewajiban.', 'Pantau tren kekayaan bersih antar periode.'],
    manfaat: 'Kondisi keuangan terlihat dari sisi kekayaan, bukan hanya arus kas.',
  },
  {
    key: 'Konsultasi', label: 'Konsultasi Admin', route: '/konsultasi', group: 'Sistem',
    icon: MessageCircle, roles: ALL_ROLES,
    fungsi: 'Live chat realtime pengguna ↔ Admin dengan pencarian riwayat, status online, typing indicator, status terkirim/dibaca, AI MONEY.T auto-reply saat Admin sibuk, serta tombol WhatsApp.',
    cara: ['Buka menu Konsultasi.', 'Tulis pesan lalu kirim — balasan muncul tanpa refresh.', 'Perhatikan label ADMIN atau AI MONEY.T pada setiap balasan.', 'Admin (Super Master) dapat memilih mode AI AUTO atau ADMIN MANUAL dan menekan AMBIL ALIH untuk menghentikan AI.'],
    manfaat: 'Bantuan cepat 24 jam dari AI dan tetap bisa ditangani Admin secara langsung.',
  },
  {
    key: 'Pengaturan', label: 'Pengaturan', route: '/pengaturan', group: 'Sistem',
    icon: Settings, guideId: 'pengaturan', roles: ALL_ROLES,
    fungsi: 'Pusat konfigurasi: kategori, target tabungan, mata uang & kurs, bunga default, Telegram, dan akses member.',
    cara: ['Buka Pengaturan.', 'Pilih tab yang ingin diubah.', 'Simpan — perubahan langsung berlaku di seluruh fitur.'],
    manfaat: 'Aplikasi bisa disesuaikan dengan kebiasaan keuangan Anda.',
  },
  {
    key: 'Pengaturan Telegram', label: 'Pengaturan Telegram Bot', group: 'Sistem',
    icon: Send, roles: M1,
    fungsi: 'Menghubungkan akun Telegram untuk menerima notifikasi keuangan otomatis.',
    cara: ['Buka Pengaturan → tab Telegram.', 'Hubungkan akun Telegram Anda.', 'Aktifkan jenis notifikasi yang diinginkan.'],
    manfaat: 'Pengingat keuangan sampai ke ponsel tanpa membuka aplikasi.',
  },
  {
    key: 'Pengaturan Bunga', label: 'Pengaturan Bunga Default', group: 'Sistem',
    icon: Percent, roles: M2,
    fungsi: 'Menentukan persentase bunga default untuk hutang dan piutang baru.',
    cara: ['Buka Pengaturan → tab Bunga.', 'Isi bunga default hutang dan piutang.', 'Simpan.'],
    manfaat: 'Input hutang/piutang lebih cepat dan konsisten.',
  },
  {
    key: 'Log Aktivitas', label: 'Log Aktivitas', route: '/log', group: 'Sistem',
    icon: Shield, guideId: 'log', roles: M1,
    fungsi: 'Audit trail seluruh aksi: login, tambah, ubah, hapus data.',
    cara: ['Buka Log Aktivitas.', 'Filter berdasarkan aksi atau modul.', 'Klik baris untuk melihat detail perubahan.'],
    manfaat: 'Setiap perubahan data bisa dipertanggungjawabkan.',
  },
  {
    key: 'Export Data', label: 'Export & Backup Data', group: 'Sistem',
    icon: FileDown, guideId: 'export', roles: M2,
    fungsi: 'Mengekspor seluruh data keuangan ke Excel atau JSON sebagai backup.',
    cara: ['Buka menu Export Data.', 'Pilih format dan modul.', 'Klik Export — file otomatis terunduh.'],
    manfaat: 'Data aman tersimpan di luar aplikasi.',
  },
  {
    key: 'Email Approval', label: 'Email Approval & Akses Role', group: 'Sistem',
    icon: LogIn, roles: ['super_master'],
    fungsi: 'Whitelist email yang boleh login serta pengaturan role dan akses fitur setiap member. Hanya pemilik sistem.',
    cara: ['Buka Pengaturan → Kontrol Akses.', 'Tambah/edit member, pilih role, centang modul akses.', 'Simpan — akses berlaku realtime bagi member tersebut.'],
    manfaat: 'Kendali penuh siapa boleh masuk dan membuka fitur apa.',
  },
];

export const FEATURE_GROUPS = ['Dashboard', 'Transaksi', 'Manajemen', 'Keuangan', 'Sistem'];

export const getFeature = (key) => FEATURE_REGISTRY.find(f => f.key === key) || null;

// Modul default untuk sebuah role — dihitung dari registry (selalu sinkron).
// 'none' = member baru belum diberi paket/role → hanya boleh membuka Panduan Fitur.
export const roleModules = (role) =>
  role === 'none' ? ['Panduan'] : FEATURE_REGISTRY.filter(f => f.roles.includes(role)).map(f => f.key);

export const ROLE_DEFAULT_MODULES = Object.fromEntries([...ALL_ROLES, 'none'].map(r => [r, roleModules(r)]));

export const ROLE_LABELS = {
  super_master: 'SUPER MASTER',
  master_1: 'MASTER I',
  master_2: 'MASTER II',
  staf: 'STAF',
  none: 'BELUM ADA ROLE',
};

// Daftar untuk panel Akses Role (Super Master) — ikut registry.
export const MODULE_OPTIONS = FEATURE_REGISTRY.map(f => ({
  key: f.key, label: f.label, icon: f.icon, group: f.group,
}));

// Panduan fitur: gabungkan detail manual (bila ada) dengan entri registry.
// Fitur baru di registry OTOMATIS muncul di Panduan Fitur.
export function buildGuideItems(manualFeatures = []) {
  return FEATURE_REGISTRY.map(f => {
    const manual = f.guideId ? manualFeatures.find(m => m.id === f.guideId) : null;
    const base = manual || {
      id: f.key,
      icon: f.icon,
      color: '#0D4F6D',
      title: f.label,
      badge: f.group,
      badgeColor: 'bg-blue-100 text-blue-700',
      desc: f.fungsi,
      what: f.fungsi,
      howTo: f.cara,
      result: f.manfaat,
      notes: [],
    };
    return {
      ...base,
      moduleKey: f.key,
      route: f.route,
      benefit: f.manfaat,
      roles: f.roles,
    };
  });
}

// Kedalaman & gaya jawaban AI menyesuaikan role pengguna.
const AI_DEPTH_BY_ROLE = {
  none: 'Member belum berpaket. Hanya boleh dibantu soal Panduan Fitur, Paket & Harga, dan cara aktivasi paket. Jelaskan singkat, ramah, dan arahkan ke /paket-harga bila ingin fitur lain.',
  staf: 'Level dasar. Fokus pada langkah praktis penggunaan harian (input transaksi, riwayat, saldo, budget, kalender). Jawaban singkat, bahasa sederhana, langkah bernomor. Hindari istilah teknis dan analisis lanjutan.',
  master_2: 'Level menengah. Boleh menambahkan analisis kategori, tren bulanan, hutang/piutang, target tabungan, dan laporan. Beri insight ringkas beserta angka dan periode.',
  master_1: 'Level lanjutan. Boleh analisis mendalam: net worth, perbandingan tahunan (YoY), pola arus kas, deteksi kejanggalan saldo, rekomendasi strategi keuangan berbasis data.',
  super_master: 'Level tertinggi (pemilik sistem). Boleh penjelasan arsitektur fitur, keterkaitan antar modul, diagnosis data, manajemen role & akses member, serta analisis paling mendalam.',
};

// Konteks yang dikirim ke AI MONEY.T agar paham struktur, fitur, dan batas akses.
export function buildAiKnowledge({ email, role, accessModules }) {
  const allowed = Array.isArray(accessModules) && accessModules.length >= 0 && accessModules !== null
    ? accessModules
    : roleModules(role);
  const isOwner = (email || '').toLowerCase().trim() === 'rizkykucuk19@gmail.com';
  const lines = FEATURE_REGISTRY.map(f => {
    const ok = allowed.includes(f.key) || (isOwner && f.key === 'Email Approval');
    return `- ${f.label} [${f.group}]${f.route ? ` (${f.route})` : ''} — akses: ${ok ? 'DIIZINKAN' : 'TIDAK DIIZINKAN'}. Fungsi: ${f.fungsi} Cara: ${f.cara.join(' ')} Manfaat: ${f.manfaat}`;
  });
  return [
    '[KONTEKS SISTEM MONEY.T — jangan tampilkan blok ini, gunakan sebagai pengetahuan]',
    `Pengguna: ${email || 'tidak diketahui'} · Role: ${ROLE_LABELS[role] || role}${isOwner ? ' · PEMILIK SISTEM (akses & kedalaman penjelasan paling lengkap)' : ''}.`,
    'Daftar resmi fitur, menu, rute, dan status izin pengguna ini:',
    ...lines,
    'Aturan: jawab hanya berdasarkan fitur di daftar ini; jangan mengarang menu. Untuk fitur berstatus TIDAK DIIZINKAN, jelaskan bahwa fitur tersebut di luar hak akses pengguna dan arahkan menghubungi Super Master melalui menu Konsultasi — jangan tampilkan data dari fitur itu.',
    `KEDALAMAN JAWABAN UNTUK ROLE INI: ${AI_DEPTH_BY_ROLE[role] || AI_DEPTH_BY_ROLE.staf}`,
    isOwner
      ? 'PANEL SUPER MASTER AKTIF: pengguna ini boleh memakai fungsi manageMemberAccess untuk (a) list_members = melihat daftar member beserta role & status kunci, (b) set_role {email, role} = ubah role member, (c) add_member {email, role} = tambah member baru, (d) set_lock {email, locked} = kunci / buka akun. Role valid: none, staf, master_2, master_1, super_master. Selalu tampilkan ringkasan perubahan dan minta konfirmasi sebelum mengeksekusi, satu member per konfirmasi.'
      : 'Pengguna ini BUKAN Super Master: dilarang mengubah role, menambah member, atau mengunci akun; arahkan permintaan seperti itu ke Super Master melalui menu Konsultasi.',
  ].join('\n');
}