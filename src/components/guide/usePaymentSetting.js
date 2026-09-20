import { useQuery } from '@tanstack/react-query';
import { PaymentSetting } from '@/api/entities';

export const DEFAULT_PRICES = { STAF: 600000, MASTER_2: 1000000, MASTER_1: 1300000 };

// Pengaturan pembayaran (rekening + harga paket) yang diatur Super Master.
export function usePaymentSetting() {
  const { data: setting, isLoading } = useQuery({
    queryKey: ['payment-setting'],
    queryFn: async () => (await PaymentSetting.list())?.[0] || null,
    staleTime: 60_000,
  });

  const accounts = (setting?.accounts || []).filter(a => a.is_active !== false && a.number);
  const priceOf = (tierKey) => Number(setting?.[`price_${tierKey}`] ?? DEFAULT_PRICES[tierKey] ?? 0);

  return { setting, accounts, priceOf, isLoading };
}