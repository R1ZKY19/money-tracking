import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCompact } from '@/lib/utils/finance';

export default function BankBalanceChart({ accounts }) {
  const data = accounts.filter(a => a.is_active !== false).map(a => ({
    name: a.name,
    balance: Math.max(0, a.current_balance || 0),
    currency: a.currency || 'IDR',
    color: a.color || '#2563EB',
  }));

  if (!data.length) return <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">Belum ada saldo rekening.</div>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 22, left: 18, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="2 6" opacity={0.55} />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} width={110} />
        <Tooltip cursor={{ fill: 'hsl(var(--muted) / .45)' }} formatter={(value, _name, item) => [formatCompact(value, item.payload.currency), 'Saldo']} />
        <Bar dataKey="balance" radius={[0, 10, 10, 0]} maxBarSize={24} animationDuration={800}>
          {data.map(item => <Cell key={item.name} fill={item.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}