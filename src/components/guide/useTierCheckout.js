import { useState } from 'react';
import { PaymentSetting } from '@/api/entities';
import { toast } from 'sonner';

// Membuka Stripe Checkout untuk paket tertentu.
export function useTierCheckout() {
  const [loadingTier, setLoadingTier] = useState(null);

  const startCheckout = async (tier) => {
    if (window.self !== window.top) {
      toast.error('Pembayaran hanya bisa dilakukan dari aplikasi yang sudah dipublikasikan (buka di tab baru).');
      return;
    }
    setLoadingTier(tier);
    try {
      const paymentSettings = await PaymentSetting.list(); const res = { data: { payment_info: paymentSettings[0] || {}, tier } };
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error(res.data?.error || 'Gagal membuka halaman pembayaran');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Gagal membuka halaman pembayaran');
    } finally {
      setLoadingTier(null);
    }
  };

  return { loadingTier, startCheckout };
}