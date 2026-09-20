import { useState } from 'react';
import { useUserRole } from '@/lib/UserRoleContext';
import {
  BarChart3, Calendar, Target, DollarSign,
  CreditCard, TrendingUp, TrendingDown, PiggyBank, Settings, Wallet,
  HandCoins, BookOpen, CheckCircle2, ArrowRight, Layers, Search,
  Zap, Info, AlertCircle, AlertTriangle, Shield, ArrowRightLeft, FileDown,
  ChevronDown, ChevronRight, Star, Heart, Sparkles, Users, Globe, Lock,
  LayoutDashboard, ListOrdered, Menu, X, MessageCircle, Phone,
  Rocket, Award, TrendingUp as TrendUp, Crown, BadgeCheck, Lightbulb
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import FeatureGuideCard from '@/components/guide/FeatureGuideCard';
import GuideStart from '@/components/guide/GuideStart';
import { guideHelp } from '@/components/guide/guideHelp';
import FeatureRoleAccess from '@/components/guide/FeatureRoleAccess';
import { WA_NUMBER } from '@/components/guide/pricingTiers';
import { buildGuideItems, FEATURE_REGISTRY } from '@/lib/featureRegistry';

// ─── ABOUT DATA ───────────────────────────────────────────────────────────────

const ABOUT_SECTIONS = [
  {
    icon: Heart,
    label: 'Apa itu MONEY TRACKING?',
    color: '#0D4F6D',
    gradient: 'linear-gradient(135deg,#0D4F6D,#0a7c9e)',
    content: 'MONEY TRACKING adalah platform manajemen keuangan pribadi berbasis web yang dirancang untuk membantu Anda memantau, menganalisis, dan mengoptimalkan kondisi keuangan secara real-time — tanpa perlu spreadsheet atau buku catatan manual.',
  },
  {
    icon: LayoutDashboard,
    label: 'Fungsi Dashboard',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg,#4F46E5,#818CF8)',
    content: 'Dashboard MONEY TRACKING berfungsi sebagai pusat kendali keuangan Anda. Semua data transaksi, saldo rekening, hutang, piutang, dan tabungan dikumpulkan dalam satu tampilan terpadu yang mudah dibaca.',
  },
  {
    icon: Target,
    label: 'Tujuan Platform',
    color: '#059669',
    gradient: 'linear-gradient(135deg,#064E3B,#059669)',
    content: 'Membantu pengguna memahami pola keuangan mereka, menghindari pemborosan, mencapai target tabungan, dan membuat keputusan finansial yang lebih cerdas berdasarkan data nyata.',
  },
  {
    icon: Star,
    label: 'Manfaat Utama',
    color: '#D97706',
    gradient: 'linear-gradient(135deg,#92400E,#D97706)',
    content: 'Hemat waktu 90% vs pencatatan manual · Visibilitas keuangan 360° · Notifikasi otomatis hutang jatuh tempo · Laporan siap pakai untuk evaluasi bulanan · Tersedia di semua perangkat.',
  },
  {
    icon: Users,
    label: 'Siapa yang Menggunakan?',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
    content: 'MONEY TRACKING cocok untuk individu, freelancer, wirausaha kecil, dan siapa saja yang ingin mengontrol keuangan pribadi mereka dengan cara yang lebih terstruktur dan profesional.',
  },
  {
    icon: Globe,
    label: 'Cara Kerja Singkat',
    color: '#0891B2',
    gradient: 'linear-gradient(135deg,#164E63,#0891B2)',
    content: 'Input transaksi → Sistem otomatis update saldo, hutang, piutang, tabungan → Dashboard menampilkan analitik real-time → Anda mendapat insight untuk pengambilan keputusan.',
  },
];

const KEY_STATS = [
  { value: '11+', label: 'Fitur Lengkap', icon: BookOpen, color: '#0D4F6D' },
  { value: '360°', label: 'Visibilitas Keuangan', icon: Globe, color: '#059669' },
  { value: '90%', label: 'Hemat Waktu', icon: Zap, color: '#D97706' },
  { value: '∞', label: 'Data Real-time', icon: TrendingUp, color: '#6366F1' },
];

// ─── FEATURES DATA ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: 'dashboard-bulanan',
    icon: BarChart3,
    color: '#0D4F6D',
    title: 'Dashboard Bulanan',
    badge: 'Halaman Utama',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Pusat kendali keuangan real-time. Tampil saat login pertama kali.',
    what: 'Menampilkan ringkasan keuangan bulan berjalan: total saldo, pendapatan, pengeluaran, cash flow, grafik tren, analitik kategori, dan skor kesehatan keuangan.',
    howTo: [
      'Buka Dashboard — tampil otomatis saat login.',
      'Pilih periode (tahun & bulan) via filter di bagian atas.',
      'Baca ringkasan Total Saldo, Pendapatan, Pengeluaran, Cash Flow, Tabungan, Hutang, Piutang, dan Saving Rate.',
      'Scroll ke bawah untuk grafik tren 12 bulan, distribusi kategori, dan insight otomatis.',
      'Cek Health Score untuk evaluasi kondisi keuangan Anda.',
    ],
    result: 'Gambaran lengkap kondisi keuangan bulan ini dalam hitungan detik.',
    notes: ['Warna hijau = positif, merah = negatif, kuning = perlu perhatian.', 'Banner merah = ada hutang jatuh tempo. Jangan diabaikan!', 'Health Score 70–100 = sehat, 50–70 = cukup, <50 = perlu tindakan.'],
  },
  {
    id: 'dashboard-tahunan',
    icon: Calendar,
    color: '#6366F1',
    title: 'Dashboard Tahunan',
    badge: 'Analitik',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    desc: 'Analisis performa keuangan tahunan dengan chart 12 bulan dan breakdown kategori.',
    what: 'Bar chart 12 bulan (Pendapatan, Pengeluaran, Tabungan), tabel rekap 7 kolom, dan breakdown kategori terbesar.',
    howTo: [
      'Klik "Dashboard Tahunan" di sidebar.',
      'Pilih tahun dari dropdown kanan atas.',
      'Baca bar chart untuk tren per bulan.',
      'Cek tabel rekap: Pendapatan, Pengeluaran, Tabungan, Bayar Hutang, Terima Piutang, Cash Flow.',
      'Scroll ke bawah untuk breakdown kategori pengeluaran/pendapatan terbesar.',
    ],
    result: 'Review kinerja keuangan setahun penuh untuk perencanaan tahun berikutnya.',
    notes: ['Gunakan menu YoY untuk membandingkan antar tahun.', 'Ideal dibuka saat evaluasi akhir tahun.'],
  },
  {
    id: 'transaksi',
    icon: CreditCard,
    color: '#059669',
    title: 'Input Transaksi',
    badge: 'Inti',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    desc: 'Pusat pencatatan semua aktivitas keuangan. Saldo, hutang, piutang, tabungan tersinkron otomatis.',
    what: '7 jenis transaksi yang masing-masing memiliki efek berbeda pada data keuangan Anda.',
    howTo: [
      'Klik "Input Transaksi" di sidebar.',
      'Klik tombol "+ Tambah Transaksi".',
      'Pilih jenis transaksi (lihat tabel di bawah).',
      'Isi tanggal, kategori, akun, nominal, deskripsi.',
      'Klik "Catat Transaksi" → sistem otomatis update data terkait.',
    ],
    result: 'Semua data keuangan tersinkron otomatis: saldo, hutang, piutang, tabungan.',
    notes: ['Hapus transaksi = rollback semua efek otomatis (saldo, hutang, dll).', 'Edit transaksi: klik ikon pensil di baris transaksi.'],
    txTypes: [
      { label: 'Pendapatan', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Saldo akun bertambah.' },
      { label: 'Pengeluaran', color: 'bg-red-100 text-red-700 border-red-200', desc: 'Saldo akun berkurang.' },
      { label: 'Tabungan', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Saldo berkurang, progress target tabungan bertambah.' },
      { label: 'Hutang Baru', color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Saldo bertambah, entri hutang baru otomatis terbuat.' },
      { label: 'Piutang Baru', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', desc: 'Saldo berkurang, entri piutang baru otomatis terbuat.' },
      { label: 'Bayar Hutang', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Saldo berkurang, sisa hutang berkurang.' },
      { label: 'Terima Piutang', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Saldo bertambah, sisa piutang berkurang.' },
    ],
  },
  {
    id: 'hutang',
    icon: TrendingDown,
    color: '#D97706',
    title: 'Manajemen Hutang',
    badge: 'Tracking',
    badgeColor: 'bg-amber-100 text-amber-700',
    desc: 'Pantau semua hutang aktif, progress pelunasan, dan jatuh tempo.',
    what: 'Daftar hutang per kreditur dengan progress bar pelunasan, tanggal jatuh tempo, dan riwayat pembayaran.',
    howTo: [
      'Buat hutang: Transaksi → pilih "Hutang Baru" → isi nama kreditur, nominal, jatuh tempo.',
      'Pantau: klik "Hutang" di sidebar untuk melihat semua hutang aktif.',
      'Bayar: dari Transaksi → "Bayar Hutang" → pilih hutang aktif → isi nominal.',
      'Status "Lunas" otomatis saat sisa hutang = 0.',
    ],
    result: 'Visibilitas lengkap semua kewajiban finansial Anda.',
    notes: ['Baris merah = jatuh tempo sudah terlewat.', 'Tidak bisa bayar melebihi sisa hutang (dicegah sistem).'],
  },
  {
    id: 'piutang',
    icon: HandCoins,
    color: '#0D9488',
    title: 'Manajemen Piutang',
    badge: 'Tracking',
    badgeColor: 'bg-teal-100 text-teal-700',
    desc: 'Catat uang yang dipinjamkan, track penerimaan, dan bunga opsional.',
    what: 'Daftar piutang per peminjam dengan sisa tagihan, riwayat cicilan, dan akumulasi bunga jika diaktifkan.',
    howTo: [
      'Buat piutang: Transaksi → "Piutang Baru" → isi nama peminjam, nominal, jatuh tempo, bunga (opsional).',
      'Monitor di menu "Piutang" di sidebar.',
      'Terima pembayaran: Transaksi → "Terima Piutang" → pilih piutang → isi nominal.',
      'Klik "Detail" untuk melihat histori cicilan.',
    ],
    result: 'Kontrol penuh atas uang yang Anda pinjamkan ke pihak lain.',
    notes: ['Bunga dihitung otomatis per bulan jika diisi.', 'Tidak bisa menerima melebihi sisa piutang.'],
  },
  {
    id: 'tabungan',
    icon: PiggyBank,
    color: '#7C3AED',
    title: 'Target Tabungan',
    badge: 'Goal',
    badgeColor: 'bg-violet-100 text-violet-700',
    desc: 'Buat target keuangan dengan deadline. Progress terupdate otomatis dari transaksi.',
    what: 'Manajemen goal keuangan dengan progress bar, estimasi tercapai, dan kategorisasi per tujuan.',
    howTo: [
      'Buka Target Tabungan → buat target baru → isi nama, nominal, mata uang, dan tenggat.',
      'Setor tabungan: Transaksi → "Tabungan" → pilih target → isi nominal.',
      'Monitor progress di menu "Target Tabungan".',
      'Status "Achieved" otomatis saat current amount ≥ target.',
    ],
    result: 'Tracking visual progress menuju setiap tujuan finansial Anda.',
    notes: ['Bisa memiliki banyak target sekaligus.', 'Setiap transaksi tabungan harus memilih target yang spesifik.'],
  },
  {
    id: 'budget',
    icon: Target,
    color: '#0891B2',
    title: 'Budget Anggaran',
    badge: 'Perencanaan',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    desc: 'Rencanakan anggaran per kategori. Progress real-time vs realisasi pengeluaran aktual.',
    what: 'Tabel anggaran per kategori dengan perbandingan rencana vs realisasi, progress bar berwarna, dan alert otomatis.',
    howTo: [
      'Pilih periode (bulan & tahun) di dropdown.',
      'Klik ikon pensil di baris kategori → isi nominal budget → simpan.',
      'Progress bar otomatis update dari transaksi pengeluaran bulan tersebut.',
      'Alert muncul otomatis saat pengeluaran >80% atau >100% dari budget.',
    ],
    result: 'Kontrol pengeluaran berbasis rencana, bukan reaktif.',
    notes: ['Legenda: Biru <50%, Hijau 50-80%, Kuning 80-90%, Oranye 90-100%, Merah >100%.', 'Budget yang belum diisi = tidak ada batas anggaran.'],
  },
  {
    id: 'saldo',
    icon: Wallet,
    color: '#1D4ED8',
    title: 'Saldo Rekening',
    badge: 'Rekening',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Kelola semua rekening bank, e-wallet, dan kas. Saldo update otomatis dari transaksi.',
    what: 'Manajemen multi-rekening dengan saldo real-time, histori mutasi per akun, dan kustomisasi tampilan.',
    howTo: [
      'Klik "+ Tambah Akun" di halaman Saldo Rekening.',
      'Pilih jenis bank/e-wallet dari daftar atau isi manual.',
      'Isi saldo awal (saldo rekening Anda saat ini).',
      'Setiap transaksi akan otomatis menambah/mengurangi saldo akun terkait.',
    ],
    result: 'Visibilitas real-time seluruh rekening di satu tempat.',
    notes: ['Saldo update otomatis — tidak perlu update manual.', 'Gunakan "Edit Saldo" untuk koreksi jika ada selisih.'],
  },
  {
    id: 'transfer',
    icon: ArrowRightLeft,
    color: '#0F766E',
    title: 'Transfer Antar Rekening',
    badge: 'Utilitas',
    badgeColor: 'bg-teal-100 text-teal-700',
    desc: 'Catat pemindahan dana antar rekening sendiri tanpa mempengaruhi pendapatan/pengeluaran.',
    what: 'Fitur khusus untuk mencatat mutasi internal antar rekening Anda sendiri.',
    howTo: [
      'Klik "Transfer" di sidebar.',
      'Pilih Rekening Asal dan Rekening Tujuan (tidak bisa sama).',
      'Isi nominal dan tanggal transfer.',
      'Klik "Konfirmasi Transfer" — saldo kedua rekening otomatis terupdate.',
    ],
    result: 'Saldo rekening asal berkurang, rekening tujuan bertambah — tidak ada efek ke pendapatan/pengeluaran.',
    notes: ['Transfer tidak tercatat sebagai pendapatan/pengeluaran.', 'Berguna untuk catat gaji masuk ke rekening tabungan.'],
  },
  {
    id: 'log',
    icon: Shield,
    color: '#BE185D',
    title: 'Log Aktivitas',
    badge: 'Audit',
    badgeColor: 'bg-pink-100 text-pink-700',
    desc: 'Rekam jejak lengkap semua aksi: login, tambah, edit, hapus data.',
    what: 'Audit trail komprehensif dengan data sebelum dan sesudah perubahan, filter per aksi dan modul.',
    howTo: [
      'Klik "Log Aktivitas" di sidebar.',
      'Gunakan filter Aksi dan Modul untuk mempersempit pencarian.',
      'Klik baris log untuk melihat detail perubahan (JSON diff).',
      'Export log untuk keperluan audit eksternal.',
    ],
    result: 'Visibilitas penuh semua perubahan data — siapa, apa, kapan.',
    notes: ['Log tidak bisa diedit/dihapus oleh user biasa.', 'Log otomatis terhapus setelah 6 bulan — export jika perlu.'],
  },
  {
    id: 'export',
    icon: FileDown,
    color: '#0891B2',
    title: 'Export & Backup Data',
    badge: '⚡ Wajib Tahu',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    desc: 'Backup semua data keuangan ke Excel atau JSON. Akses dari tombol di sidebar.',
    what: 'Export seluruh data: Transaksi, Hutang, Piutang, Tabungan, Akun, Kategori, dan Log ke format Excel (.xlsx) atau JSON.',
    howTo: [
      'Buka sidebar → scroll ke bawah → klik ikon "Export Data".',
      'Pilih format: Excel (.xlsx) atau JSON.',
      'Pilih modul yang ingin diekspor (atau pilih semua).',
      'Klik "Export" → file otomatis terunduh.',
    ],
    result: 'File backup siap pakai untuk arsip, audit, atau restore data.',
    notes: ['Lakukan export minimal setiap bulan.', 'Simpan file di cloud (Google Drive, dll) sebagai backup tambahan.', 'Excel = mudah dibaca. JSON = cocok untuk arsip jangka panjang.'],
  },
  {
    id: 'pengaturan',
    icon: Settings,
    color: '#374151',
    title: 'Pengaturan',
    badge: 'Konfigurasi',
    badgeColor: 'bg-gray-100 text-gray-700',
    desc: 'Pusat konfigurasi: kategori, target tabungan, kurs mata uang, dan Telegram bot.',
    what: 'Tab Kategori, Tab Tabungan, Tab Bunga Default, Tab Mata Uang & Kurs, Tab Telegram Bot, Tab Email Approval (admin).',
    howTo: [
      'Tab Kategori: Tambah/edit/hapus kategori Pendapatan, Pengeluaran, Tabungan.',
      'Tab Tabungan: Buat dan kelola target tabungan (nama, nominal, deadline).',
      'Tab Mata Uang & Kurs: Tambah mata uang negara lain dan kelola kurs otomatis/manual.',
      'Tab Bunga: Atur bunga default untuk hutang dan piutang.',
      'Tab Telegram: Hubungkan akun Telegram untuk notifikasi otomatis.',
    ],
    result: 'Semua konfigurasi tersimpan dan berlaku di seluruh fitur MONEY TRACKING.',
    notes: ['Kategori favorit (bintang) muncul di bagian atas dropdown transaksi.', 'Mata uang yang ditambahkan otomatis muncul di semua dropdown input.', 'Perubahan kurs berlaku langsung di semua form.'],
  },
];

// ─── ABOUT SECTION ────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden p-8 bg-sidebar text-sidebar-primary">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
            <img src="https://i.ibb.co/5gCcXjjn/image.png" alt="MONEY TRACKING" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20 uppercase tracking-widest">Platform Keuangan Pribadi</span>
            </div>
            <h2 className="text-2xl font-heading font-black mb-2">MONEY TRACKING</h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-xl">
              Platform manajemen keuangan pribadi berbasis web yang dirancang untuk membantu Anda memantau, menganalisis, dan mengoptimalkan kondisi keuangan secara real-time — tanpa perlu spreadsheet atau buku catatan manual.
            </p>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KEY_STATS.map((s, i) => {
          const SI = s.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card text-center hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <SI size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ABOUT_SECTIONS.map((s, i) => {
          const SI = s.icon;
          return (
            <div key={i} className="group flex gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.gradient }}>
                <SI size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">{s.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow diagram */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <p className="text-sm font-bold text-foreground">Alur Kerja MONEY TRACKING</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {[
            { step: '1', label: 'Input Transaksi', color: '#059669' },
            { step: '→', label: '', color: '' },
            { step: '2', label: 'Saldo & Data Tersinkron', color: '#0D4F6D' },
            { step: '→', label: '', color: '' },
            { step: '3', label: 'Dashboard Analitik', color: '#6366F1' },
            { step: '→', label: '', color: '' },
            { step: '4', label: 'Insight & Keputusan', color: '#D97706' },
          ].map((item, i) =>
            item.label ? (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-border bg-muted/30">
                <span className="text-[10px] font-black text-white w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color }}>{item.step}</span>
                <span className="text-[10px] font-semibold text-foreground text-center">{item.label}</span>
              </div>
            ) : (
              <ArrowRight key={i} size={14} className="text-muted-foreground shrink-0" />
            )
          )}
        </div>
      </div>

      {/* CTA banner */}
      <div className="rounded-2xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
        <p className="text-sm font-bold text-foreground mb-1">Siap mulai mengelola keuangan lebih cerdas?</p>
        <p className="text-xs text-muted-foreground">Lihat tab <span className="font-semibold text-primary">Paket & Harga</span> untuk pilih paket atau <span className="font-semibold text-primary">Panduan Fitur</span> untuk tutorial lengkap.</p>
      </div>
    </div>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────

// ─── FEATURES SECTION ─────────────────────────────────────────────────────────

function FeaturesSection({ search }) {
  const { role } = useUserRole();
  // Daftar panduan dibangun dari registry fitur: fitur baru/berubah/dihapus
  // otomatis ikut di sini beserta hak akses rolenya.
  const items = buildGuideItems(FEATURES);
  const filtered = items.filter(f =>
    !search ||
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.desc.toLowerCase().includes(search.toLowerCase()) ||
    f.badge.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify([f.howTo, f.notes, f.benefit, f.moduleKey, guideHelp[f.id]]).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <GuideStart />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-black text-foreground">Panduan Lengkap Fitur</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Klik fitur untuk memperluas panduan step-by-step</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {filtered.length} fitur
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tidak ada fitur ditemukan</p>
          <p className="text-xs mt-1">Coba kata kunci yang berbeda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.moduleKey} className="space-y-1.5">
              <FeatureGuideCard feature={f} />
              <div className="px-1">
                <p className="text-[11px] text-muted-foreground mb-1.5"><span className="font-semibold text-foreground">Manfaat:</span> {f.benefit}</p>
                <FeatureRoleAccess roles={f.roles} route={f.route} myRole={role} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5 border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
        <p className="text-sm font-bold text-foreground mb-1">Butuh Bantuan Lebih Lanjut?</p>
        <p className="text-xs text-muted-foreground mb-3">Hubungi admin kami via WhatsApp untuk panduan personal.</p>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin MONEY TRACKING! Saya butuh bantuan penggunaan fitur.')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(90deg,#25D366,#128C7E)' }}
        >
          <Phone size={13} /> Chat Admin via WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PanduanFitur() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('features');

  const tabs = [
    { id: 'about', label: 'Tentang MONEY TRACKING', icon: Sparkles },
    { id: 'features', label: 'Panduan Fitur', icon: BookOpen },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="rounded-xl p-5 sm:p-7 bg-sidebar text-sidebar-primary relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <BookOpen size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full mb-2">Dokumentasi Resmi</span>
            <h1 className="text-2xl font-heading font-black mb-1.5">Panduan Lengkap MONEY TRACKING</h1>
            <p className="text-white/75 text-sm leading-relaxed mb-4 max-w-2xl">
              Dokumentasi interaktif lengkap — dari penjelasan platform hingga panduan step-by-step setiap fitur.
            </p>
            <div className="flex items-center gap-4 flex-wrap text-xs text-white/60">
              <div className="flex items-center gap-1.5"><Sparkles size={12} /><span>Platform overview</span></div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1.5"><BookOpen size={12} /><span>{FEATURE_REGISTRY.length} fitur terdokumentasi</span></div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1.5"><Zap size={12} /><span>Klik untuk perluas detail</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari fitur, panduan, atau topik..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveTab('features'); }}
          className="pl-10 h-11 rounded-xl bg-card border-border"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      {!search && (
        <div className="flex gap-1 p-1 rounded-2xl bg-muted border border-border">
          {tabs.map(t => {
            const TI = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TI size={13} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      <div>
        {search ? (
          <FeaturesSection search={search} />
        ) : (
          <>
            {activeTab === 'about' && <AboutSection />}
            {activeTab === 'features' && <FeaturesSection search="" />}
          </>
        )}
      </div>
    </div>
  );
}