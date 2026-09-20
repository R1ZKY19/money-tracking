import { entity, readRows } from '@/components/demo/demoStore';
const conversations=entity('DemoConversation');
function summary(content) {
  const money=n=>`Rp ${Number(n).toLocaleString('id-ID')}`;
  const accounts=readRows('Account');
  const total=accounts.reduce((n,a)=>n+Number(a.current_balance||0),0);
  const query=content.toLowerCase();
  let text=`Saldo seluruh rekening contoh: **${money(total)}**. Coba catat transaksi atau transfer, lalu tanyakan saldo lagi untuk melihat perubahan.`;
  if(/hutang|utang|piutang/.test(query)) text=['Debt','Receivable'].map(name=>`${name==='Debt'?'Hutang':'Piutang'} demo: **${money(readRows(name).reduce((n,r)=>n+Number(r.remaining_amount||0),0))}**`).join('\n\n');
  if(/tabung|target/.test(query)) text=readRows('SavingTarget').map(r=>`**${r.name}**: ${money(r.current_amount)} dari ${money(r.target_amount)}.`).join('\n\n') || 'Belum ada target demo.';
  if(/pengeluaran|pemasukan|arus|ringkas/.test(query)) {
    const now=new Date(); const period=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const tx=readRows('Transaction').filter(t=>t.date?.startsWith(period));
    const sum=type=>tx.filter(t=>t.type===type).reduce((n,t)=>n+t.amount,0);
    text=`Bulan ini: pemasukan **${money(sum('income'))}**, pengeluaran **${money(sum('expense'))}**, dan tabungan **${money(sum('saving'))}**. Semua angka berasal dari data demo lokal.`;
  }
  return `**Simulasi demo lokal — bukan respons AI online.**\n\n${text}\n\nUntuk mencoba: tanyakan saldo, hutang/piutang, tabungan, atau ringkasan bulanan. Integrasi AI asli tidak dijalankan dalam demo.`;
}
export default {
  listConversations: query=>conversations.filter(query),
  getConversation: id=>conversations.get(id),
  createConversation: data=>conversations.create({...data,messages:[{id:crypto.randomUUID(),role:'assistant',content:summary('ringkasan')}]}),
  updateConversation: (id,data)=>conversations.update(id,data),
  subscribeToConversation: (id,callback)=>conversations.subscribe(async()=>callback(await conversations.get(id))),
  addMessage: async (conversation,message)=> {
    const current=await conversations.get(conversation.id);
    return conversations.update(current.id,{messages:[...(current.messages||[]),{...message,id:crypto.randomUUID()},{id:crypto.randomUUID(),role:'assistant',content:summary(message.content)}]});
  },
};