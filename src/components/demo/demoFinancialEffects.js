import { record } from '@/components/demo/demoStore';
export function find(db, name, id) {
  const row = (db[name] || []).find(r=>r.id===id);
  if (!row) throw new Error('Data demo terkait tidak ditemukan');
  return row;
}
export function balance(db,id,delta) { const a=find(db,'Account',id); a.current_balance=Number(a.current_balance || 0)+delta; }
export function effects(db,tx,reverse=false) {
  const amount=Number(tx.amount), sign=reverse?-1:1;
  const credit=['income','debt','receivable_receipt'].includes(tx.type) || (tx.type==='transfer' && tx.reference==='TRANSFER-IN');
  const account=find(db,'Account',tx.account_id);
  if (!reverse && !credit && amount>account.current_balance) throw new Error('Saldo demo tidak mencukupi');
  balance(db,account.id,(credit?amount:-amount)*sign);
  if (['debt','receivable'].includes(tx.type)) {
    const name=tx.type==='debt'?'Debt':'Receivable';
    if(reverse) { db[name]=(db[name] || []).filter(r=>r.id!==tx.related_id); }
    else {
      const person=tx.type==='debt'?'creditor_name':'debtor_name';
      if(!tx[person]) throw new Error('Nama pihak terkait wajib diisi');
      const row=record({[person]:tx[person],total_amount:amount,remaining_amount:amount,currency:tx.currency,due_date:tx.due_date,interest_rate:tx.interest_rate || 0,notes:tx.description,status:'active'});
      (db[name] ||= []).push(row); tx.related_id=row.id;
    }
  }
  if (['debt_payment','receivable_receipt'].includes(tx.type)) {
    const name=tx.type==='debt_payment'?'Debt':'Receivable'; const row=find(db,name,tx.related_id);
    if(!reverse && (row.status!=='active' || amount>row.remaining_amount)) throw new Error('Nominal melebihi sisa hutang/piutang demo');
    row.remaining_amount=Math.min(row.total_amount,Number(row.remaining_amount || 0)-amount*sign);
    row.status=row.remaining_amount===0?(name==='Debt'?'paid':'completed'):'active';
  }
  if(tx.type==='saving') {
    const row=find(db,'SavingTarget',tx.related_id); row.current_amount=Math.max(0,Number(row.current_amount || 0)+amount*sign);
    row.status=row.current_amount>=row.target_amount?'achieved':'active';
    if(tx.destination_account_id) {
      const to=find(db,'Account',tx.destination_account_id);
      if(to.id===account.id || to.currency!==account.currency) throw new Error('Rekening tujuan tidak valid');
      balance(db,to.id,amount*sign); tx.destination_account_name=to.name;
    }
  }
}