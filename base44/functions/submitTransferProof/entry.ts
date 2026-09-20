import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { TIER_PRICING, ROLE_LEVEL } from '../../shared/tierPricing.ts';

// Membaca bukti transfer, mencocokkan nominal, lalu membuka akses paket otomatis.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Harus login dulu' }, { status: 401 });

    const { tier, proof_url } = await req.json();
    const plan = TIER_PRICING[tier];
    if (!plan) return Response.json({ error: 'Paket tidak dikenal' }, { status: 400 });
    if (!proof_url) return Response.json({ error: 'Bukti transfer belum diunggah' }, { status: 400 });

    const svc = base44.asServiceRole;

    // Harga & rekening diatur Super Master lewat Pengaturan → Pembayaran.
    const settings = await svc.entities.PaymentSetting.list();
    const setting = settings?.[0];
    const expectedPrice = Number(setting?.[`price_${tier}`] ?? plan.price);
    plan.price = expectedPrice;
    const activeAccounts = (setting?.accounts || []).filter(a => a?.is_active !== false && a?.number);
    const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

    const extraction = await svc.integrations.Core.InvokeLLM({
      prompt: `Anda memeriksa BUKTI TRANSFER BANK dari Indonesia (screenshot m-banking / struk ATM) untuk mendeteksi kemungkinan bukti PALSU atau EDITAN.
Baca gambar dengan sangat teliti dan keluarkan data apa adanya, JANGAN mengarang atau menebak nilai yang tidak terlihat jelas di gambar.
- amount: nominal transfer dalam angka rupiah (tanpa titik/koma, tanpa "Rp").
- is_transfer_receipt: true hanya jika gambar benar-benar bukti transfer/pembayaran bank yang berhasil.
- status_success: true jika ada keterangan transaksi berhasil/sukses/berhasil dikirim.
- looks_edited: true jika ada indikasi manipulasi/edit digital (font tidak konsisten, susunan berantakan, watermark hilang, resolusi/blur tidak wajar di area nominal atau nama).
- bank_name: nama bank pengirim ATAU bank tujuan yang tercantum (sesuai konteks aplikasi m-banking yang digunakan).
- destination_account: nomor rekening TUJUAN transfer (rekening penerima), ambil apa adanya termasuk spasi/tanda baca jika ada.
- destination_name: nama pemilik rekening TUJUAN transfer yang tercantum di bukti.
- sender_name: nama pengirim/pemilik rekening asal.
- confidence: 0..1, seberapa yakin Anda membaca nominal DAN rekening tujuan dengan benar.
Nominal yang seharusnya dibayar adalah TEPAT ${plan.price} (tidak boleh kurang). Jangan membulatkan, jangan menyesuaikan hasil bacaan agar cocok dengan angka itu — laporkan nominal yang benar-benar tertulis di gambar.`,
      file_urls: [proof_url],
      response_json_schema: {
        type: 'object',
        properties: {
          is_transfer_receipt: { type: 'boolean' },
          status_success: { type: 'boolean' },
          looks_edited: { type: 'boolean' },
          amount: { type: 'number' },
          bank_name: { type: 'string' },
          destination_account: { type: 'string' },
          destination_name: { type: 'string' },
          sender_name: { type: 'string' },
          transfer_date: { type: 'string' },
          confidence: { type: 'number' },
          notes: { type: 'string' },
        },
        required: ['is_transfer_receipt', 'amount'],
      },
    });

    const detected = Number(extraction?.amount || 0);
    const detectedAccountDigits = onlyDigits(extraction?.destination_account);
    // Tanpa rekening resmi, bukti tidak bisa diverifikasi otomatis — wajib review Super Master.
    const noOfficialAccounts = activeAccounts.length === 0;
    const accountMatch = !noOfficialAccounts
      && activeAccounts.some(a => onlyDigits(a.number) && detectedAccountDigits && onlyDigits(a.number) === detectedAccountDigits);

    // Nama pemilik rekening tujuan wajib cocok dengan salah satu rekening resmi.
    const normalizeName = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    const detectedDestName = normalizeName(extraction?.destination_name);
    const holderConfigured = activeAccounts.some(a => normalizeName(a.holder));
    const holderMatch = !holderConfigured
      || (!!detectedDestName && activeAccounts.some(a => normalizeName(a.holder) === detectedDestName));
    const confidence = Number(extraction?.confidence ?? 1);

    let status = 'verified';
    let reason = 'Nominal, rekening tujuan, dan nama sesuai — bukti transfer valid.';

    if (noOfficialAccounts) {
      status = 'pending';
      reason = 'Rekening resmi belum diatur Super Master — bukti transfer menunggu verifikasi manual.';
    } else if (!extraction?.is_transfer_receipt) {
      status = 'rejected';
      reason = 'Gambar yang diunggah tidak terbaca sebagai bukti transfer bank.';
    } else if (extraction?.looks_edited) {
      status = 'rejected';
      reason = 'Bukti transfer terindikasi hasil edit/manipulasi digital. Ditolak demi keamanan.';
    } else if (extraction?.status_success === false) {
      status = 'rejected';
      reason = 'Bukti transfer terbaca, tetapi status transaksinya belum berhasil.';
    } else if (!detectedAccountDigits) {
      status = 'rejected';
      reason = 'Nomor rekening tujuan tidak terbaca pada bukti transfer.';
    } else if (!accountMatch) {
      status = 'rejected';
      reason = `Nomor rekening tujuan pada bukti transfer (${extraction?.destination_account || '-'}) tidak sesuai dengan rekening resmi MONEY TRACKING.`;
    } else if (!extraction?.sender_name) {
      status = 'rejected';
      reason = 'Nama pengirim tidak terbaca pada bukti transfer.';
    } else if (!holderMatch) {
      status = 'rejected';
      reason = `Nama pemilik rekening tujuan pada bukti (${extraction?.destination_name || '-'}) tidak sesuai dengan rekening resmi MONEY TRACKING.`;
    } else if (!detected || detected !== plan.price) {
      status = 'rejected';
      reason = `Nominal pada bukti transfer (Rp ${detected.toLocaleString('id-ID')}) tidak sama dengan harga ${plan.label} (Rp ${plan.price.toLocaleString('id-ID')}). Transfer harus tepat sesuai harga paket.`;
    } else if (!extraction?.transfer_date) {
      status = 'pending';
      reason = 'Tanggal transfer tidak terbaca — menunggu verifikasi manual Super Master.';
    } else if (extraction?.status_success !== true) {
      status = 'pending';
      reason = 'Status "berhasil" tidak terbaca jelas pada bukti — menunggu verifikasi manual Super Master.';
    } else if (confidence < 0.8) {
      status = 'pending';
      reason = 'Bukti transfer kurang jelas terbaca — menunggu verifikasi manual Super Master.';
    }

    const record = await svc.entities.PaymentProof.create({
      buyer_email: user.email,
      buyer_name: user.full_name || '',
      tier,
      tier_label: plan.label,
      expected_amount: plan.price,
      detected_amount: detected,
      detected_bank: extraction?.bank_name || '',
      detected_account: extraction?.destination_account || '',
      detected_date: extraction?.transfer_date || '',
      sender_name: extraction?.sender_name || '',
      proof_url,
      status,
      reason,
      verified_at: new Date().toISOString(),
      granted_role: status === 'verified' ? plan.role : '',
    });

    if (status !== 'verified') {
      return Response.json({ status, reason, detected_amount: detected, id: record.id });
    }

    // Buka akses paket — hanya naik level, tidak menurunkan role yang sudah lebih tinggi.
    const existing = await svc.entities.ApprovedUser.filter({ email: user.email });
    const current = existing?.[0];
    if (current) {
      if ((ROLE_LEVEL[current.role] || 0) < ROLE_LEVEL[plan.role]) {
        await svc.entities.ApprovedUser.update(current.id, {
          role: plan.role,
          is_approved: true,
          approved_at: new Date().toISOString(),
          notes: `Aktivasi otomatis ${plan.label} via bukti transfer (${record.id})`,
        });
      }
    } else {
      await svc.entities.ApprovedUser.create({
        email: user.email,
        role: plan.role,
        is_approved: true,
        approved_at: new Date().toISOString(),
        notes: `Aktivasi otomatis ${plan.label} via bukti transfer (${record.id})`,
      });
    }

    return Response.json({
      status: 'verified',
      reason,
      detected_amount: detected,
      role: plan.role,
      id: record.id,
    });
  } catch (error) {
    console.error('submitTransferProof error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}