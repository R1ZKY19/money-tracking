import { CheckCircle2, Link, Loader2, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionCard from '@/components/ui/SectionCard';

export default function TelegramTabContent({
  user, telegramChatId, setTelegramChatId, telegramLinked, setTelegramLinked,
  telegramSaving, saveTelegramLink, unlinkTelegram,
  webhookStatus, webhookLoading, setWebhook, checkWebhook,
}) {
  return (
    <div className="space-y-4">

      {/* Step 1: Hubungkan */}
      <SectionCard>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-sm">Hubungkan Akun Telegram</h3>
              {telegramLinked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={9} /> Terhubung
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Masukkan Telegram ID agar bot mengenali akunmu</p>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3">
              <p className="text-xs font-semibold text-blue-800 mb-1.5">Cara mendapatkan Telegram ID:</p>
              <ol className="space-y-0.5 text-xs text-blue-700 list-decimal list-inside">
                <li>Buka Telegram → cari <strong>@userinfobot</strong></li>
                <li>Ketik <code className="bg-blue-100 px-1 rounded">/start</code> — bot balas dengan ID kamu</li>
                <li>Salin angkanya dan paste di bawah ini</li>
              </ol>
            </div>

            {telegramLinked && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">ID Terhubung: <strong>{user?.telegram_chat_id || telegramChatId}</strong></p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Contoh: 123456789"
                value={telegramChatId}
                onChange={e => { setTelegramChatId(e.target.value); setTelegramLinked(false); }}
                className="flex-1 h-9 text-sm"
                type="number"
              />
              <Button onClick={saveTelegramLink} disabled={!telegramChatId.trim() || telegramSaving} size="sm" className="bg-[#0D4F6D] hover:bg-[#0a3d55] shrink-0 h-9">
                {telegramSaving ? <Loader2 size={13} className="animate-spin" /> : <Link size={13} />}
                <span className="ml-1">{telegramLinked ? 'Perbarui' : 'Hubungkan'}</span>
              </Button>
              {telegramLinked && (
                <Button variant="outline" onClick={unlinkTelegram} disabled={telegramSaving} size="sm" className="text-red-500 border-red-200 h-9 shrink-0">
                  Putus
                </Button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Step 2: Webhook (Admin only) */}
      {user?.role === 'admin' && (
        <SectionCard>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-lg">⚙️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm mb-1">Aktifkan Bot <span className="text-xs font-normal text-muted-foreground">(Admin · lakukan sekali)</span></h3>
              <p className="text-xs text-muted-foreground mb-3">Setup webhook agar bot Telegram bisa menerima & memproses pesan</p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3 text-xs text-amber-800 space-y-1">
                <p>1. Klik <strong>Aktifkan Webhook</strong> di bawah</p>
                <p>2. Klik <strong>Cek Status</strong> — pastikan tertulis <strong>Aktif</strong></p>
                <p>3. Buka bot di Telegram → ketik <code className="bg-amber-100 px-1 rounded">/start</code></p>
              </div>

              {webhookStatus && (
                <div className={`p-2.5 rounded-xl border text-xs mb-3 ${webhookStatus.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <p className="font-semibold">{webhookStatus.is_active ? '✅ Webhook Aktif' : '❌ Webhook Tidak Aktif'}</p>
                  {webhookStatus.url && <p className="mt-1 break-all opacity-60 font-mono text-[10px]">{webhookStatus.url}</p>}
                  {webhookStatus.last_error_message && <p className="mt-1 text-red-600">Error: {webhookStatus.last_error_message}</p>}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={setWebhook} disabled={webhookLoading} size="sm" className="bg-[#0D4F6D] hover:bg-[#0a3d55] h-9">
                  {webhookLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span className="ml-1">Aktifkan Webhook</span>
                </Button>
                <Button variant="outline" onClick={checkWebhook} disabled={webhookLoading} size="sm" className="h-9">
                  {webhookLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  <span className="ml-1">Cek Status</span>
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Panduan Perintah */}
      <SectionCard title="📋 Panduan Perintah Bot" subtitle="Daftar semua perintah yang benar-benar berfungsi">

        {/* Notifikasi Otomatis */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
          <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">🤖 Notifikasi Otomatis Real-Time</p>
          <p className="text-xs text-indigo-600 mb-3">Dikirim otomatis setiap ada aktivitas — tanpa perlu mengetik apapun.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { color: 'bg-emerald-100 border-emerald-200', icon: '💚', label: 'Pemasukan Baru', desc: 'Rekening, kategori, nominal, keterangan, saldo terbaru' },
              { color: 'bg-red-100 border-red-200', icon: '🔴', label: 'Pengeluaran Baru', desc: 'Rekening, kategori, nominal, keterangan, saldo terbaru' },
              { color: 'bg-indigo-100 border-indigo-200', icon: '💙', label: 'Tabungan Dicatat', desc: 'Rekening, target, nominal, saldo rekening setelahnya' },
              { color: 'bg-violet-100 border-violet-200', icon: '🔄', label: 'Transfer Antar Rekening', desc: 'Rekening asal & tujuan, nominal, saldo keduanya' },
              { color: 'bg-amber-100 border-amber-200', icon: '🟡', label: 'Bayar Hutang', desc: 'Rekening, kreditur, nominal, saldo terbaru' },
              { color: 'bg-teal-100 border-teal-200', icon: '🟢', label: 'Terima Piutang', desc: 'Rekening, debitur, nominal, saldo terbaru' },
              { color: 'bg-sky-100 border-sky-200', icon: '🌅', label: 'Ringkasan Harian 07.00', desc: 'Saldo semua rekening, ringkasan bulan, jatuh tempo, transaksi hari ini' },
            ].map(({ color, icon, label, desc }) => (
              <div key={label} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${color}`}>
                <span className="text-base shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview contoh pesan */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📩 Contoh Pesan yang Diterima</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-border font-mono text-[11px] leading-relaxed shadow-sm">
              <p className="font-bold text-red-600 mb-1">🔴 PENGELUARAN BARU</p>
              <p className="text-muted-foreground">━━━━━━━━━━━━━━━━━━</p>
              <p>💳 <b>Rekening :</b> BCA Tabungan</p>
              <p>🏷️ <b>Kategori :</b> Makan & Minum</p>
              <p>💵 <b>Nominal  :</b> − IDR 85.000</p>
              <p>📝 <b>Ket.     :</b> Makan siang</p>
              <p>📅 <b>Tanggal  :</b> 22 Jun 2026</p>
              <p className="mt-1.5 font-semibold">💰 Saldo BCA: IDR 4.915.000</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-border font-mono text-[11px] leading-relaxed shadow-sm">
              <p className="font-bold text-violet-600 mb-1">🔄 TRANSFER ANTAR REKENING</p>
              <p className="text-muted-foreground">━━━━━━━━━━━━━━━━━━</p>
              <p>📤 <b>Dari :</b> BCA Tabungan</p>
              <p>📥 <b>Ke   :</b> OVO</p>
              <p>💵 <b>Nominal :</b> IDR 500.000</p>
              <p>📝 <b>Ket.    :</b> Top up OVO</p>
              <p className="mt-1.5 font-semibold">📊 Saldo Setelah:</p>
              <p>  📤 BCA: IDR 4.415.000</p>
              <p>  📥 OVO: IDR 650.000</p>
            </div>
          </div>
        </div>

        {/* Perintah Manual */}
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">✍️ Perintah Manual</p>

        <div className="space-y-3 mb-4">
          {/* Pemasukan */}
          <div className="rounded-xl border border-emerald-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-200">
              <span className="text-sm">💚</span>
              <span className="text-xs font-bold text-emerald-800">Pemasukan</span>
              <span className="text-[10px] text-emerald-600 ml-auto">saldo rekening BERTAMBAH</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-emerald-100">
              {[
                { cmd: '/income 500000 Gaji', alias: '/pemasukan', desc: 'Catat pemasukan IDR' },
                { cmd: '/income USD 100 Freelance', alias: '/pemasukan', desc: 'Pemasukan mata uang asing' },
              ].map(({ cmd, alias, desc }) => (
                <div key={cmd} className="p-3 bg-white">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <code className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">{cmd}</code>
                    <span className="text-[10px] text-emerald-500">atau <code>{alias}</code></span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="rounded-xl border border-red-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
              <span className="text-sm">🔴</span>
              <span className="text-xs font-bold text-red-800">Pengeluaran</span>
              <span className="text-[10px] text-red-600 ml-auto">saldo rekening BERKURANG</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-red-100">
              {[
                { cmd: '/expense 150000 Makan siang', alias: '/pengeluaran', desc: 'Catat pengeluaran hari ini' },
                { cmd: '/expense 50000 Parkir tanggal kemarin', alias: '/pengeluaran', desc: 'Custom tanggal: kemarin / 2026-06-10 / 15-06-2026' },
              ].map(({ cmd, alias, desc }) => (
                <div key={cmd} className="p-3 bg-white">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <code className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">{cmd}</code>
                    <span className="text-[10px] text-red-500">atau <code>{alias}</code></span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabungan */}
          <div className="rounded-xl border border-indigo-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-200">
              <span className="text-sm">💙</span>
              <span className="text-xs font-bold text-indigo-800">Tabungan</span>
              <span className="text-[10px] text-indigo-600 ml-auto">saldo berkurang · progress target bertambah</span>
            </div>
            <div className="p-3 bg-white">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <code className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">/saving 200000 Dana darurat</code>
                <span className="text-[10px] text-indigo-400">atau <code>/tabungan</code></span>
              </div>
              <p className="text-[11px] text-muted-foreground">Alokasikan ke tabungan — rekening −200.000, progress target +200.000</p>
            </div>
          </div>

          {/* Hutang & Piutang */}
          <div className="rounded-xl border border-amber-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
              <span className="text-sm">💳</span>
              <span className="text-xs font-bold text-amber-800">Hutang & Piutang</span>
              <span className="text-[10px] text-amber-600 ml-auto">jt / jatuh tempo / due</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-amber-100">
              {[
                { cmd: '/hutang 1000000 BRI jt 2026-12-31', color: 'amber', desc: 'Catat hutang ke BRI, jatuh tempo 2026-12-31' },
                { cmd: '/hutang 500000 Pak Budi', color: 'amber', desc: 'Hutang tanpa jatuh tempo' },
                { cmd: '/piutang 500000 Ani jt 2026-08-15', color: 'teal', desc: 'Catat piutang dari Ani, jatuh tempo 2026-08-15' },
                { cmd: '/piutang 200000 Budi due 2026-09-01', color: 'teal', desc: 'Gunakan "due" sebagai kata kunci jatuh tempo' },
              ].map(({ cmd, color, desc }) => (
                <div key={cmd} className="p-3 bg-white">
                  <code className={`text-xs font-mono text-${color}-700 bg-${color}-50 border border-${color}-200 px-1.5 py-0.5 rounded block mb-0.5`}>{cmd}</code>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Perintah Cek */}
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">🔍 Cek & Ringkasan</p>
        <div className="rounded-xl border border-border overflow-hidden mb-4">
          {[
            { cmd: '/saldo', desc: 'Saldo semua rekening + total IDR + waktu cek' },
            { cmd: '/saldo BCA', desc: 'Filter rekening yang namanya mengandung "BCA"' },
            { cmd: '/rekening', desc: 'Daftar semua rekening aktifmu + nama yang bisa dipakai di @rekening' },
            { cmd: '/ringkasan', desc: 'Pemasukan, pengeluaran, tabungan, cash flow, total saldo bulan ini' },
            { cmd: '/hutanglist', desc: 'Semua hutang aktif — nama, sisa, jatuh tempo, status (Lewat!/Segera!)' },
            { cmd: '/piutanglist', desc: 'Semua piutang aktif — nama, sisa, jatuh tempo, status' },
            { cmd: '/help', desc: 'Tampilkan panduan lengkap langsung di Telegram' },
          ].map(({ cmd, desc }, i, arr) => (
            <div key={cmd} className={`flex items-start gap-3 px-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}>
              <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0 mt-0.5">{cmd}</code>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>

        {/* Cara pilih rekening */}
        <div className="mb-4 rounded-xl border border-violet-200 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border-b border-violet-200">
            <span className="text-sm">🏦</span>
            <span className="text-xs font-bold text-violet-800">Pilih Rekening Tujuan</span>
            <span className="text-[10px] text-violet-600 ml-auto">tambahkan @NamaRekening</span>
          </div>
          <div className="p-3 bg-white space-y-2">
            <p className="text-xs text-muted-foreground">Tambahkan <code className="bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded text-violet-700">@NamaRekening</code> di akhir perintah untuk memilih rekening tujuan. Nama tidak harus persis — cukup sebagian kata.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { cmd: '/pemasukan 500000 Gaji @BCA', desc: 'Masuk ke rekening BCA' },
                { cmd: '/pengeluaran 50000 Parkir @OVO', desc: 'Keluar dari rekening OVO' },
                { cmd: '/tabungan 200000 Dana Darurat @Mandiri', desc: 'Ke rekening Mandiri' },
                { cmd: '/pemasukan 500000 Gaji', desc: 'Tanpa @rekening → otomatis ke rekening pertama' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="p-2 rounded-lg bg-violet-50 border border-violet-100">
                  <code className="text-xs font-mono text-violet-700 break-all block mb-0.5">{cmd}</code>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">💡 Ketik <code className="bg-violet-50 border border-violet-200 px-1 rounded text-violet-700">/rekening</code> di bot untuk melihat semua rekening &amp; nama yang bisa dipakai.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
          <p className="font-semibold mb-1">💡 Catatan Penting</p>
          <p>• Semua perintah diawali <strong>/</strong> (slash) dan dikirim di chat dengan bot</p>
          <p>• Tambahkan <code className="bg-blue-100 px-1 rounded">@NamaRekening</code> untuk memilih rekening — tanpa itu otomatis ke rekening pertama</p>
          <p>• Ketik <code className="bg-blue-100 px-1 rounded">/rekening</code> di bot untuk melihat daftar rekening aktifmu</p>
          <p>• Mata uang asing di depan angka: <code className="bg-blue-100 px-1 rounded">USD 100</code> · <code className="bg-blue-100 px-1 rounded">SAR 500</code> · <code className="bg-blue-100 px-1 rounded">EUR 50</code></p>
          <p>• Notifikasi otomatis hanya dikirim ke akun yang sudah menghubungkan Telegram ID</p>
        </div>
      </SectionCard>
    </div>
  );
}