import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserCog } from 'lucide-react';
import ProfileIdentity from '@/components/profile/ProfileIdentity';
import ProfileSecurity from '@/components/profile/ProfileSecurity';
import ProfileModules from '@/components/profile/ProfileModules';

export default function ProfilePanel(props) {
  return (
    <Dialog open={props.open} onOpenChange={(v) => { if (!v) props.onClose(); }}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl animate-fade-scale sm:w-[calc(100vw-3rem)]">
        <header className="relative overflow-hidden border-b border-sidebar-border bg-sidebar px-4 py-4 text-sidebar-foreground sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex items-start gap-3 pr-8">
            <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent text-sidebar-primary sm:flex">
              <UserCog size={18} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-sidebar-primary sm:text-lg">
                Profil &amp; pengaturan akun
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-sidebar-foreground/70 sm:text-sm">
                Identitas, akses fitur, dan keamanan dalam satu tempat.
              </DialogDescription>
            </div>
          </div>
        </header>

        <div className="flex max-h-[78dvh] flex-col overflow-y-auto lg:flex-row lg:items-stretch">
          <ProfileIdentity {...props} />
          <div className="min-w-0 flex-1 space-y-4 bg-background/40 p-4 sm:space-y-5 sm:p-6">
            <ProfileModules modules={props.modules} />
            <ProfileSecurity {...props} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}