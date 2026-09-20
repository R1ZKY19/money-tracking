import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Data isolation: a logged-in user may only process their OWN schedules.
    // Scheduled/system runs (no user token) process every active schedule.
    let scopedUserId = null;
    try {
      const user = await base44.auth.me();
      if (user?.id) scopedUserId = user.id;
    } catch { /* system/scheduled run */ }

    const query = { is_active: true };
    if (scopedUserId) query.created_by_id = scopedUserId;
    const recurring = await base44.asServiceRole.entities.RecurringTransaction.filter(query, '', 10000);

    const today = new Date().toISOString().slice(0, 10);
    let processed = 0, skipped = 0;

    for (const rt of recurring) {
      try {
        const todayDate = new Date(today);
        const startDate = new Date(rt.start_date);
        const endDate = rt.end_date ? new Date(rt.end_date) : null;

        if (todayDate < startDate || (endDate && todayDate > endDate)) { skipped++; continue; }
        // Idempotent: never create twice on the same day.
        if (rt.last_created_date === today) { skipped++; continue; }

        const lastCreated = rt.last_created_date ? new Date(rt.last_created_date) : null;
        if (!shouldProcessToday(today, rt.frequency, rt.day_of_week, rt.day_of_month, lastCreated)) { skipped++; continue; }

        await base44.asServiceRole.entities.Transaction.create({
          date: today,
          type: rt.type,
          category_id: rt.category_id,
          category_name: rt.category_name,
          account_id: rt.account_id,
          account_name: rt.account_name,
          amount: rt.amount,
          currency: rt.currency,
          description: `[Rutin] ${rt.description || rt.name}`,
          operation_key: `recurring-${rt.id}-${today}`,
          created_by_id: rt.created_by_id
        });

        // Balance effect must match the app rules: only income increases the account.
        if (rt.account_id) {
          const account = await base44.asServiceRole.entities.Account.filter({ id: rt.account_id }, '', 1);
          if (account.length > 0) {
            const delta = rt.type === 'income' ? rt.amount : -rt.amount;
            await base44.asServiceRole.entities.Account.update(account[0].id, {
              current_balance: (account[0].current_balance || 0) + delta
            });
          }
        }

        await base44.asServiceRole.entities.RecurringTransaction.update(rt.id, { last_created_date: today });
        processed++;
      } catch (err) {
        console.error(`Error processing recurring tx ${rt.id}:`, err.message);
        skipped++;
      }
    }

    return Response.json({ processed, skipped, scoped: !!scopedUserId, message: `Processed ${processed} recurring transactions` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function shouldProcessToday(today, frequency, dayOfWeek, dayOfMonth, lastCreated) {
  const todayDate = new Date(today);
  const currentDayOfWeek = todayDate.getDay();
  const currentDayOfMonth = todayDate.getDate();

  if (!lastCreated) return true;

  const diffDays = Math.floor((todayDate - new Date(lastCreated)) / 86400000);

  switch (frequency) {
    case 'daily': return diffDays >= 1;
    case 'weekly': return diffDays >= 7 && currentDayOfWeek === (dayOfWeek ?? 0);
    case 'biweekly': return diffDays >= 14;
    case 'monthly': return diffDays >= 27 && currentDayOfMonth >= (dayOfMonth || 1);
    case 'quarterly': return diffDays >= 89 && currentDayOfMonth >= (dayOfMonth || 1);
    case 'yearly': return diffDays >= 364;
    default: return false;
  }
}