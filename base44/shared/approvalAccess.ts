export const approvalOwnerEmail = 'rizkykucuk19@gmail.com';
export const isApprovalOwner = user => user?.role === 'admin' && String(user?.email || '').trim().toLowerCase() === approvalOwnerEmail;

export async function canManageApprovals(base44, user) {
  if (isApprovalOwner(user)) return true;
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return false;
  const rows = await base44.asServiceRole.entities.ApprovedUser.filter({ email, is_approved: true }, '-created_date', 1);
  return rows[0]?.role === 'super_master';
}