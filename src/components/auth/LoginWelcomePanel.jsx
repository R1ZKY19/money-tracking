import { TrendingUp, ArrowDownRight } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';

export default function LoginWelcomePanel({ english = false }) {
  return (
    <section className="flex flex-col justify-between bg-login-navy text-login-white px-6 py-8 sm:px-10 lg:p-14 xl:p-20">
      <BrandLogo className="w-56 sm:w-64 lg:w-80 h-auto" />
      <div className="max-w-lg py-8 lg:py-16">
        <p className="text-login-highlight text-[11px] font-medium uppercase tracking-[1.3px] mb-4">{english ? 'YOUR FINANCIAL JOURNEY' : 'LANGKAH KECIL, MASA DEPAN LEBIH BAIK'}</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.15] tracking-tight">{english ? 'Welcome back.' : 'Selamat datang kembali.'}</h1>
        <p className="mt-5 text-login-white/75 text-sm sm:text-base leading-relaxed">{english ? 'Every record is a step toward greater financial control. Keep tracking your income and expenses—consistency today builds a stronger tomorrow.' : 'Setiap catatan adalah langkah menuju keuangan yang lebih terarah. Tetap semangat mencatat pemasukan dan pengeluaran—konsistensi hari ini membangun masa depan yang lebih kuat.'}</p>
        <div className="hidden lg:grid grid-cols-2 gap-4 mt-10 border-t border-login-white/15 pt-6">
          <div><TrendingUp className="text-login-highlight mb-3" size={20} /><p className="text-sm font-medium">{english ? 'Record every income' : 'Catat setiap pemasukan'}</p><p className="text-xs text-login-white/60 leading-relaxed mt-2">{english ? 'Recognize your progress, one entry at a time.' : 'Hargai hasil kerja keras, sekecil apa pun nilainya.'}</p></div>
          <div><ArrowDownRight className="text-login-highlight mb-3" size={20} /><p className="text-sm font-medium">{english ? 'Know your expenses' : 'Kenali setiap pengeluaran'}</p><p className="text-xs text-login-white/60 leading-relaxed mt-2">{english ? 'Make room for what matters most.' : 'Kelola dengan sadar, prioritaskan yang berarti.'}</p></div>
        </div>
      </div>
      <p className="hidden lg:block text-[11px] text-login-white/50 leading-relaxed">{english ? 'Small steps. Clear records. Stronger finances.' : 'Langkah kecil. Catatan rapi. Keuangan lebih kuat.'}</p>
    </section>
  );
}