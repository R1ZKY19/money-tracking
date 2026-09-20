import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { isInternalOrAdmin } from '../../shared/internalAuth.ts';

/**
 * Auto-delete data pengguna yang berusia > 6 bulan (180 hari).
 * 7 hari sebelum dihapus, data sudah ditandai dengan flag "akan_dihapus".
 * Dijalankan via scheduled automation setiap hari.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (!(await isInternalOrAdmin(base44, body))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const DELETE_AFTER_DAYS = 180;   // 6 bulan
    const WARN_BEFORE_DAYS  = 7;     // peringatan 7 hari sebelum

    // Tanggal batas: data dibuat sebelum ini → akan dihapus sekarang
    const deleteThreshold = new Date(now);
    deleteThreshold.setDate(deleteThreshold.getDate() - DELETE_AFTER_DAYS);

    // Tanggal batas: data dibuat sebelum ini → masuk periode peringatan
    const warnThreshold = new Date(now);
    warnThreshold.setDate(warnThreshold.getDate() - (DELETE_AFTER_DAYS - WARN_BEFORE_DAYS));

    const deleteISO = deleteThreshold.toISOString();
    const warnISO   = warnThreshold.toISOString();

    let deleted = 0;
    let warned  = 0;

    // ── Entities yang ikut rotasi ──
    const ENTITIES = [
      'Transaction',
      'DebtPayment',
      'ReceivablePayment',
      'ActivityLog',
    ];

    for (const entityName of ENTITIES) {
      // 1. Ambil semua record yang sudah melewati batas hapus
      const toDelete = await base44.asServiceRole.entities[entityName].filter(
        { created_date: { $lt: deleteISO } }, '', 5000
      );

      for (const rec of toDelete) {
        await base44.asServiceRole.entities[entityName].delete(rec.id);
        deleted++;
      }

      // 2. Tandai record yang masuk periode peringatan (created antara warnThreshold dan deleteThreshold)
      // Kita simpan warning_deletion_date ke DataDeletionWarning agar frontend bisa baca
      const toWarn = await base44.asServiceRole.entities[entityName].filter(
        { created_date: { $lt: warnISO, $gte: deleteISO } }, '', 5000
      );
      warned += toWarn.length;
    }

    // ── Hitung user yang punya data hampir kadaluarsa ──
    // Simpan summary ke DataDeletionWarning entity (1 record per user, upsert-style)
    const allUsers = await base44.asServiceRole.entities.User.list('', 1000);

    for (const user of allUsers) {
      // Hitung berapa transaksi user yang masuk zona peringatan
      const warningTxs = await base44.asServiceRole.entities.Transaction.filter(
        { created_by_id: user.id, created_date: { $lt: warnISO, $gte: deleteISO } }, '', 1
      );

      // Cari record peringatan existing milik user
      const existing = await base44.asServiceRole.entities.DataDeletionWarning.filter(
        { user_id: user.id }, '', 1
      );

      if (warningTxs.length > 0) {
        // Hitung tanggal hapus terdekat (data tertua user)
        const oldestTx = await base44.asServiceRole.entities.Transaction.filter(
          { created_by_id: user.id }, 'created_date', 1
        );
        let deletionDate = null;
        if (oldestTx.length > 0) {
          const d = new Date(oldestTx[0].created_date);
          d.setDate(d.getDate() + DELETE_AFTER_DAYS);
          deletionDate = d.toISOString();
        }

        if (existing.length > 0) {
          await base44.asServiceRole.entities.DataDeletionWarning.update(existing[0].id, {
            has_warning: true,
            deletion_date: deletionDate,
            checked_at: now.toISOString(),
          });
        } else {
          await base44.asServiceRole.entities.DataDeletionWarning.create({
            user_id: user.id,
            has_warning: true,
            deletion_date: deletionDate,
            checked_at: now.toISOString(),
          });
        }
      } else {
        // Tidak ada data hampir kadaluarsa → hapus/reset flag jika ada
        if (existing.length > 0) {
          await base44.asServiceRole.entities.DataDeletionWarning.update(existing[0].id, {
            has_warning: false,
            deletion_date: null,
            checked_at: now.toISOString(),
          });
        }
      }
    }

    return Response.json({
      success: true,
      deleted,
      warned,
      message: `Auto-delete selesai: ${deleted} record dihapus, ${warned} record dalam periode peringatan.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});