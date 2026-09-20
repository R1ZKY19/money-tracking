import { transact, record } from '@/components/demo/demoStore';
import { find, effects } from '@/components/demo/demoFinancialEffects';
const types=['income','expense','saving','debt','receivable','debt_payment','receivable_receipt','investment','transfer'];
export default function demoFinancialMutation({action,id,data={}}) {
  return transact(db => {
    db.Transaction ||= [];
    if(['create','transfer'].includes(action) && data.operation_key) {
      const duplicate=db.Transaction.filter(t=>t.operation_key===data.operation_key);
      if(duplicate.length) return {duplicate:true,transaction:duplicate[0],transactions:duplicate};
    }
    if(action==='delete' || action==='update') {
      const old=find(db,'Transaction',id);
      if(old.type==='transfer') {
        if(action==='update') throw new Error('Batalkan transfer demo lalu buat ulang');
        const pair=db.Transaction.filter(t=>old.transfer_pair_id?t.transfer_pair_id===old.transfer_pair_id:t.id===id);
        pair.forEach(t=>effects(db,t,true)); db.Transaction=db.Transaction.filter(t=>!pair.includes(t));
        return {success:true};
      }
      effects(db,old,true);
      if(action==='delete') {db.Transaction=db.Transaction.filter(t=>t.id!==id);return {success:true};}
    }
    if(!['create','update','transfer'].includes(action)) throw new Error('Aksi demo tidak didukung');
    const amount=Number(data.amount);
    const parsed=new Date(`${data.date}T12:00:00Z`);
    if(!Number.isFinite(amount) || amount<=0 || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==data.date) throw new Error('Nominal atau tanggal tidak valid');
    if(action==='transfer' || data.type==='transfer') {
      const from=find(db,'Account',data.from_account_id || data.account_id), to=find(db,'Account',data.to_account_id || data.destination_account_id);
      if(from.id===to.id || from.currency!==to.currency) throw new Error('Pilih dua rekening berbeda dengan mata uang sama');
      const common={date:data.date,amount,currency:from.currency,type:'transfer',description:data.description || `Transfer ${from.name} → ${to.name}`,operation_key:data.operation_key,transfer_pair_id:`demo-${crypto.randomUUID()}`};
      const out=record({...common,account_id:from.id,account_name:from.name,reference:'TRANSFER-OUT'});
      const incoming=record({...common,account_id:to.id,account_name:to.name,reference:'TRANSFER-IN'});
      effects(db,out); effects(db,incoming); db.Transaction.push(out,incoming);
      return {transactions:[out,incoming],from_balance_after:from.current_balance,to_balance_after:to.current_balance};
    }
    if(!types.includes(data.type)) throw new Error('Jenis transaksi tidak valid');
    const account=find(db,'Account',data.account_id);
    const tx=record({...data,id:action==='update'?id:undefined,amount,currency:account.currency,account_name:account.name});
    effects(db,tx);
    if(action==='update') db.Transaction=db.Transaction.map(t=>t.id===id?tx:t); else db.Transaction.push(tx);
    return {transaction:tx};
  });
}