import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { TIER_PRICING, ROLE_LEVEL } from '../../shared/tierPricing.ts';

const SUPER_MASTER_EMAIL = 'rizkykucuk19@gmail.com';

// Super Master menyetujui/menolak bukti transfer secara manual dari popup detail.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.email !== SUPER_MASTER_EMAIL) {
      return Response.json({ error: 'Hanya Super Master yang bisa melakukan ini' }, { status: 403 });
    }

    const { proof_id, status } = await req.json();
    if (!proof_id || !['verified', 'rejected'].includes(status)) {
      return Response.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const proof = await svc.entities.PaymentProof.get(proof_id);
    if (!proof) return Response.json({ error: 'Bukti transfer tidak ditemukan' }, { status: 404 });

    const plan = TIER_PRICING[proof.tier];
    const reason = status === 'verified'
      ? 'Disetujui manual oleh Super Master.'
      : 'Ditolak manual oleh Super Master.';

    await svc.entities.PaymentProof.update(proof_id, {
      status,
      reason,
      verified_at: new Date().toISOString(),
      granted_role: status === 'verified' && plan ? plan.role : '',
    });

    if (status === 'verified' && plan) {
      const existing = await svc.entities.ApprovedUser.filter({ email: proof.buyer_email });
      const current = existing?.[0];
      if (current) {
        if ((ROLE_LEVEL[current.role] || 0) < ROLE_LEVEL[plan.role]) {
          await svc.entities.ApprovedUser.update(current.id, {
            role: plan.role,
            is_approved: true,
            approved_at: new Date().toISOString(),
            notes: `Aktivasi manual ${plan.label} via bukti transfer (${proof_id})`,
          });
        }
      } else {
        await svc.entities.ApprovedUser.create({
          email: proof.buyer_email,
          role: plan.role,
          is_approved: true,
          approved_at: new Date().toISOString(),
          notes: `Aktivasi manual ${plan.label} via bukti transfer (${proof_id})`,
        });
      }
    }

    return Response.json({ ok: true, status });
  } catch (error) {
    console.error('reviewPaymentProof error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}