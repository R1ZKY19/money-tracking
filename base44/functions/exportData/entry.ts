import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = user.id;

    // Fetch all user data with graceful fallback
    const fetchWithFallback = async (entityFn, defaultValue = []) => {
      try {
        return await entityFn();
      } catch (error) {
        console.warn(`Entity fetch failed: ${error.message}`);
        return defaultValue;
      }
    };

    const results = await Promise.allSettled([
      fetchWithFallback(() => base44.asServiceRole.entities.Account.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.Category.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.Transaction.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.Debt.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.Receivable.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.SavingTarget.filter({ created_by_id: uid })),
      fetchWithFallback(() => base44.asServiceRole.entities.ExpenseGoal.filter({ created_by_id: uid })),
    ]);

    const [accounts, categories, transactions, debts, receivables, savingTargets, expenseGoals] = results.map(r => r.value || []);

    // Create backup object
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      data: {
        accounts,
        categories,
        transactions,
        debts,
        receivables,
        savingTargets,
        expenseGoals,
      }
    };

    // Create JSON file
    const json = JSON.stringify(backup, null, 2);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fincat-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});