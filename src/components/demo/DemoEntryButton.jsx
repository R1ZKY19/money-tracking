import { Play } from 'lucide-react';
import { startDemo } from '@/components/demo/demoSession';
export default function DemoEntryButton({ disabled, english }) {
  return <div className="mt-5 space-y-2">
    <button type="button" disabled={disabled} onClick={startDemo} className="ex-auth-google"><Play size={17} />TRY DEMO</button>
    <p className="text-center text-xs text-muted-foreground">{english ? 'No account needed. Explore with isolated sample data.' : 'Tanpa akun. Jelajahi fitur dengan data contoh terpisah.'}</p>
  </div>;
}