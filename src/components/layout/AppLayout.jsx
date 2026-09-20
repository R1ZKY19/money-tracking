import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import MobileMoreMenu from './MobileMoreMenu';
import PageTransitionLoader from '@/components/PageTransitionLoader';
import MoneyAssistant from '@/components/assistant/MoneyAssistant';
import { useAuth } from '@/lib/AuthContext';
import UsageTracker from '@/components/usage/UsageTracker';
import RealtimeSync from '@/components/RealtimeSync';
import { DEMO_MODE } from '@/components/demo/demoSession';
import DemoBanner from '@/components/demo/DemoBanner';
import DailyGreetingPopup from '@/components/layout/DailyGreetingPopup';

export default function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { user } = useAuth();
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop sidebar: visible lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-auto lg:ml-64" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Top header — mobile & tablet — FIXED saat scroll */}
        <div className="fixed top-0 left-0 lg:left-64 right-0 z-30">
          <MobileHeader />
        </div>

        {/* Spacer agar konten tidak tertutup header fixed */}
        <div className="h-[62px] shrink-0" />
        {DEMO_MODE && <DemoBanner />}

        {/* Page content */}
        <div className="overflow-x-hidden p-3 pr-3 sm:p-4 sm:pr-4 md:p-5 md:pr-5 lg:p-6 lg:pr-6 max-w-[1600px] mx-auto w-full flex-1 pb-24 lg:pb-8 page-enter">
          {!DEMO_MODE && user?.id && <UsageTracker key={user.id} userId={user.id} />}
          <Outlet />
        </div>
      </main>

      <MobileBottomNav onMore={() => setMoreOpen(true)} />
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />

      {user?.id && <MoneyAssistant key={user.id} uid={user.id} />}
      {!DEMO_MODE && user?.id && <DailyGreetingPopup userId={user.id} userName={user.full_name} />}
      <PageTransitionLoader />
      <RealtimeSync />


    </div>
  );
}