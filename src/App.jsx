import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { FeatureColorProvider } from '@/lib/FeatureColorContext';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import { UserRoleProvider } from '@/lib/UserRoleContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/lib/errorBoundary';
import Login from '@/pages/Login';
import AppWelcomeLoading from '@/components/auth/AppWelcomeLoading';
import PendingValidationScreen from '@/components/auth/PendingValidationScreen';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import GoogleUnavailable from '@/pages/GoogleUnavailable';
import RequireModule from '@/components/RequireModule';
import CodeGuard from '@/components/security/CodeGuard';

// Pages
import DashboardBulanan from '@/pages/DashboardBulanan';
import DashboardTahunan from '@/pages/DashboardTahunan';
import Tabungan from '@/pages/Tabungan';
import Hutang from '@/pages/Hutang';
import Piutang from '@/pages/Piutang';
import SaldoAkun from '@/pages/SaldoAkun';
import CrossCheckSaldoBank from '@/pages/CrossCheckSaldoBank';
import Transaksi from '@/pages/Transaksi';
import Pengaturan from '@/pages/Pengaturan';
import BudgetPlan from '@/pages/BudgetPlan';
import RiwayatTransaksi from '@/pages/RiwayatTransaksi';
import AktivitasLog from '@/pages/AktivitasLog';
import Transfer from '@/pages/Transfer';
import PanduanFitur from '@/pages/PanduanFitur';
import NetWorthTracker from '@/pages/NetWorthTracker';
import YearOverYearComparison from '@/pages/YearOverYearComparison';
import PremiumProfile from '@/pages/PremiumProfile';
import LaporanKeuangan from '@/pages/LaporanKeuangan';
import TransaksiRutin from '@/pages/TransaksiRutin';
import KalenderKeuangan from '@/pages/KalenderKeuangan';
import Konsultasi from '@/pages/Konsultasi';
import AsistenAI from '@/pages/AsistenAI';
import PaketHarga from '@/pages/PaketHarga';


// Guard: redirect ke /login jika belum login, simpan URL tujuan di ?next=
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || isLoadingPublicSettings) return null;
  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AppWelcomeLoading />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'email_not_approved') {
    return <PendingValidationScreen />;
  }

  if (authError?.type === 'email_check_error') {
    return <PendingValidationScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/google-belum-tersedia" element={<GoogleUnavailable />} />

      {/* Protected routes — semua wajib login */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={<DashboardBulanan />} />
        <Route path="/tahunan" element={<RequireModule module="Dashboard Tahunan"><DashboardTahunan /></RequireModule>} />
        <Route path="/tabungan" element={<RequireModule module="Tabungan"><Tabungan /></RequireModule>} />
        <Route path="/hutang" element={<RequireModule module="Hutang"><Hutang /></RequireModule>} />
        <Route path="/piutang" element={<RequireModule module="Piutang"><Piutang /></RequireModule>} />
        <Route path="/saldo" element={<RequireModule module="Saldo Rekening"><SaldoAkun /></RequireModule>} />
        <Route path="/cross-check-saldo" element={<RequireModule module="Saldo Rekening"><CrossCheckSaldoBank /></RequireModule>} />
        <Route path="/transaksi" element={<RequireModule module="Input Transaksi"><Transaksi /></RequireModule>} />
        <Route path="/riwayat" element={<RequireModule module="Riwayat Transaksi"><RiwayatTransaksi /></RequireModule>} />
        <Route path="/transfer" element={<RequireModule module="Transfer"><Transfer /></RequireModule>} />
        <Route path="/rutin" element={<RequireModule module="Transaksi Rutin"><TransaksiRutin /></RequireModule>} />
        <Route path="/kalender" element={<RequireModule module="Kalender"><KalenderKeuangan /></RequireModule>} />
        <Route path="/budget" element={<RequireModule module="Budget"><BudgetPlan /></RequireModule>} />
        <Route path="/laporan" element={<RequireModule module="Laporan"><LaporanKeuangan /></RequireModule>} />
        <Route path="/konsultasi" element={<RequireModule module="Konsultasi"><Konsultasi /></RequireModule>} />

        <Route path="/matauang" element={<Navigate to="/pengaturan" replace />} />
        <Route path="/networth" element={<RequireModule module="Net Worth"><NetWorthTracker /></RequireModule>} />
        <Route path="/yoy" element={<RequireModule module="YoY Comparison"><YearOverYearComparison /></RequireModule>} />
        <Route path="/pengaturan" element={<RequireModule module="Pengaturan"><Pengaturan /></RequireModule>} />
        <Route path="/log" element={<RequireModule module="Log Aktivitas"><AktivitasLog /></RequireModule>} />
        <Route path="/panduan" element={<RequireModule module="Panduan"><PanduanFitur /></RequireModule>} />
        <Route path="/paket-harga" element={<PaketHarga />} />
        <Route path="/profile-premium" element={<PremiumProfile />} />
        <Route path="/asisten" element={<AsistenAI />} />

      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <FeatureColorProvider>
            <AuthProvider>
              <QueryClientProvider client={queryClientInstance}>
                <CurrencyProvider>
                  <UserRoleProvider>
                    <Router>
                      <CodeGuard />
                      <AuthenticatedApp />
                    </Router>
                  </UserRoleProvider>
                </CurrencyProvider>
                <Toaster />
              </QueryClientProvider>
            </AuthProvider>
          </FeatureColorProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;