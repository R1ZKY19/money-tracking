import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Debt, Receivable, RecurringTransaction, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import CalendarDayDetail from '@/components/calendar/CalendarDayDetail';
import CalendarLegend from '@/components/calendar/CalendarLegend';
import { buildMonthGrid, buildCalendarEvents, todayISO } from '@/lib/financialCalendar';
import { MONTHS_ID } from '@/lib/utils/finance';

const now = new Date();

export default function KalenderKeuangan() {
  const { user } = useAuth();
  const uid = user?.id;
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState(todayISO());

  const { data: transactions = [], isLoading } = useQuery({ queryKey: ['transactions', uid], queryFn: () => Transaction.list(), enabled: !!uid, staleTime: 60000 });
  const { data: debts = [] } = useQuery({ queryKey: ['debts', uid], queryFn: () => Debt.list(), enabled: !!uid, staleTime: 60000 });
  const { data: receivables = [] } = useQuery({ queryKey: ['receivables', uid], queryFn: () => Receivable.list(), enabled: !!uid, staleTime: 60000 });
  const { data: recurring = [] } = useQuery({ queryKey: ['recurring', uid], queryFn: () => RecurringTransaction.list(), enabled: !!uid, staleTime: 60000 });

  const cells = useMemo(() => buildMonthGrid(ym.year, ym.month), [ym]);
  const events = useMemo(() => buildCalendarEvents(
    { transactions, debts, receivables, recurring },
    cells[0].date, cells[cells.length - 1].date
  ), [transactions, debts, receivables, recurring, cells]);

  const shift = (delta) => setYm(({ year, month }) => {
    const m = month + delta;
    return m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m };
  });

  const monthCount = cells.filter(c => c.inMonth).reduce((s, c) => s + (events[c.date]?.length || 0), 0);

  return (
    <div className="space-y-5 stagger">
      <PageHeader icon={CalendarDays} title="Kalender Keuangan" subtitle="Transaksi, jatuh tempo hutang & piutang, dan jadwal rutin" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard
            title={`${MONTHS_ID[ym.month - 1]} ${ym.year}`}
            subtitle={`${monthCount} aktivitas pada bulan ini`}
            action={
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shift(-1)}><ChevronLeft size={14} /></Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { setYm({ year: now.getFullYear(), month: now.getMonth() + 1 }); setSelected(todayISO()); }}>Hari Ini</Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shift(1)}><ChevronRight size={14} /></Button>
              </div>
            }
          >
            {isLoading ? <div className="skeleton h-80 w-full" /> : <CalendarGrid cells={cells} events={events} selected={selected} onSelect={setSelected} />}
            <div className="mt-4 pt-3 border-t border-border"><CalendarLegend /></div>
          </SectionCard>
        </div>
        <SectionCard title="Detail Hari" subtitle="Klik tanggal untuk melihat rincian">
          <CalendarDayDetail date={selected} events={events[selected]} />
        </SectionCard>
      </div>
    </div>
  );
}