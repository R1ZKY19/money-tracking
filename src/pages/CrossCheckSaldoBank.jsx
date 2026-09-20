import { useQuery } from '@tanstack/react-query';
import { Account } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { ScanSearch } from 'lucide-react';
import BankCrossCheck from '@/components/saldo/BankCrossCheck';

export default function CrossCheckSaldoBank() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', uid],
    queryFn: () => uid ? Account.list() : [],
    enabled: !!uid,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <ScanSearch className="w-6 h-6 text-primary" />
          Cross Check Saldo Bank
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Rekonsiliasi saldo sistem vs saldo aktual bank secara real-time, lengkap dengan audit log</p>
      </div>

      <BankCrossCheck accounts={accounts} />
    </div>
  );
}