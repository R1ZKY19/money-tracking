import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransitionLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;
  return <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/10"><div className="h-full w-2/3 bg-primary shadow-[0_0_18px_hsl(var(--primary))]" style={{ animation: 'lineMove .52s ease-in-out infinite' }} /></div>;
}