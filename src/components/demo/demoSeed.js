export const DEMO_USER = { id: 'demo-user', email: 'visitor@example.invalid', full_name: 'Pengunjung Demo', username: 'moneyt_demo', role: 'admin', created_date: '2025-01-01T00:00:00.000Z' };
export default function demoSeed() {
  const now = new Date();
  const date = (offset = 0, day = 1) => { const d = new Date(now.getFullYear(), now.getMonth() + offset, day, 12); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const stamp = now.toISOString();
  const row = (id, data) => ({ id, created_by_id: DEMO_USER.id, created_date: stamp, updated_date: stamp, ...data });
  const categories = [['Gaji','income'],['Freelance','income'],['Makan & Minum','expense'],['Transportasi','expense'],['Belanja','expense'],['Tagihan','expense'],['Dana Darurat','saving']].map(([name,type],i) => row(`demo-cat-${i}`, { name, type, is_active:true, currency:'IDR', icon: 'Wallet', color: ['#1683B8','#2F8062','#B34444'][i%3] }));
  const accounts = [row('demo-bca',{ name:'BCA Demo',currency:'IDR',initial_balance:15000000,current_balance:15000000,is_active:true,icon:'Wallet',color:'#1683B8',account_number:'DEMO-001',account_holder_name:'Pengunjung Demo' }), row('demo-mandiri',{ name:'Mandiri Demo',currency:'IDR',initial_balance:5000000,current_balance:5000000,is_active:true,icon:'Wallet',color:'#2F8062',account_number:'DEMO-002',account_holder_name:'Pengunjung Demo' })];
  const tx = [];
  for (let offset = -23; offset <= 0; offset++) {
    [12000000,2000000,1500000,600000,1000000,2000000,1500000].forEach((amount,i) => {
      const c = categories[i]; const value = i === 6 ? amount : Math.round(amount * (1 + (offset % 5) * .035));
      tx.push(row(`demo-tx-${offset}-${i}`,{ date:date(offset,Math.min(i+1,now.getDate())), type:c.type, amount:value, category_id:c.id,category_name:c.name,account_id:'demo-bca',account_name:'BCA Demo', currency:'IDR',description:`${c.name} — data contoh`,related_id:i===6?'demo-goal':'',related_type:i===6?'saving_target':'',destination_account_id:i===6?'demo-mandiri':'' }));
      accounts[0].current_balance += c.type === 'income' ? value : -value;
      if (i === 6) accounts[1].current_balance += value;
    });
  }
  const obligations = [row('demo-debt',{creditor_name:'Koperasi Contoh',total_amount:8000000,remaining_amount:8000000,currency:'IDR',status:'active',due_date:date(0,now.getDate()+5),interest_rate:0,notes:'Hutang fiktif untuk mencoba pembayaran'})];
  const receivables = [row('demo-rec',{debtor_name:'Pelanggan Contoh',total_amount:3000000,remaining_amount:3000000,currency:'IDR',status:'active',due_date:date(0,now.getDate()+10),interest_rate:0,notes:'Piutang fiktif untuk mencoba penerimaan'})];
  tx.push(row('demo-debt-tx',{date:date(),type:'debt',amount:8000000,account_id:'demo-bca',account_name:'BCA Demo',currency:'IDR',creditor_name:'Koperasi Contoh',related_id:'demo-debt',related_type:'debt',description:'Pinjaman contoh'}), row('demo-rec-tx',{date:date(),type:'receivable',amount:3000000,account_id:'demo-bca',account_name:'BCA Demo',currency:'IDR',debtor_name:'Pelanggan Contoh',related_id:'demo-rec',related_type:'receivable',description:'Piutang contoh'}));
  accounts[0].current_balance += 5000000;
  const pair = {date:date(),type:'transfer',amount:500000,currency:'IDR',description:'Transfer contoh',transfer_pair_id:'demo-pair'};
  tx.push(row('demo-transfer-out',{...pair,account_id:'demo-bca',account_name:'BCA Demo',reference:'TRANSFER-OUT'}),row('demo-transfer-in',{...pair,account_id:'demo-mandiri',account_name:'Mandiri Demo',reference:'TRANSFER-IN'}));
  accounts[0].current_balance -= 500000; accounts[1].current_balance += 500000;
  return {
    User:[DEMO_USER], Account:accounts, Category:categories, Transaction:tx, Debt:obligations, Receivable:receivables,
    SavingTarget:[row('demo-goal',{name:'Dana Darurat',category:'dana_darurat',target_amount:60000000,initial_amount:0,current_amount:36000000,currency:'IDR',status:'active',start_date:date(-23),deadline:date(12),frequency:'monthly',deposit_amount:2000000,priority:'high',flexibility:'normal',color:'#2F8062',icon:'Target',source_account_id:'demo-bca',destination_account_id:'demo-mandiri'})],
    BudgetPlan:[row('demo-budget',{year:now.getFullYear(),month:now.getMonth()+1,income:[{name:'Gaji',budget:12000000},{name:'Freelance',budget:2500000}],expense:[{name:'Makan & Minum',budget:2000000},{name:'Transportasi',budget:800000},{name:'Belanja',budget:1500000},{name:'Tagihan',budget:2500000}],saving:[{name:'Dana Darurat',budget:2000000}]})],
    ApprovedUser:[row('demo-approval',{email:DEMO_USER.email,is_approved:true,role:'master_1'})],
    ActivityLog:[row('demo-log',{action:'login',module:'auth',description:'Sesi demo lokal dimulai — semua data fiktif',status:'success'})],
    AppNotification:[row('demo-notification',{title:'Selamat datang di DEMO MODE',message:'Coba ubah data contoh. RESET DEMO DATA mengembalikan semua contoh awal.',type:'system',target_email:DEMO_USER.email})],
    Currency:[row('demo-idr',{code:'IDR',name:'Rupiah',symbol:'Rp',is_active:true})], ExchangeRate:[], DebtPayment:[], ReceivablePayment:[], BalanceReconciliation:[],
  };
}