import PageHeader from '@/components/ui/PageHeader';
import PricingSection from '@/components/guide/PricingSection';
import { Tag } from 'lucide-react';

// Halaman mandiri Paket & Harga — bisa diakses langsung tanpa lewat tab Panduan Fitur.
export default function PaketHarga() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Tag}
        title="Paket & Harga"
        subtitle="Pilih level akses MONEY TRACKING yang sesuai kebutuhan Anda"
      />
      <PricingSection />
    </div>
  );
}