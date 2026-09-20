import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Save, Pencil, CheckCircle2, X } from 'lucide-react';

/**
 * ConfirmDialog — Premium SaaS-style confirmation modal
 * type: 'delete' | 'save' | 'update' | 'custom'
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  type = 'save',
  confirmLabel,
  cancelLabel = 'Batal',
  loading = false,
}) {
  const config = {
    delete: {
      icon: Trash2,
      iconBg: 'bg-red-50 border border-red-100',
      iconColor: 'text-red-500',
      accent: 'border-red-100',
      btnClass: 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200',
      defaultLabel: 'Ya, Hapus Data',
      badge: 'Tindakan Berbahaya',
      badgeClass: 'bg-red-50 text-red-600 border border-red-200',
    },
    save: {
      icon: Save,
      iconBg: 'bg-emerald-50 border border-emerald-100',
      iconColor: 'text-emerald-600',
      accent: 'border-emerald-100',
      btnClass: 'bg-[#0D4F6D] hover:bg-[#0a3d55] text-white shadow-sm',
      defaultLabel: 'Ya, Simpan',
      badge: 'Konfirmasi Simpan',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    update: {
      icon: Pencil,
      iconBg: 'bg-blue-50 border border-blue-100',
      iconColor: 'text-blue-600',
      accent: 'border-blue-100',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200',
      defaultLabel: 'Ya, Perbarui',
      badge: 'Konfirmasi Perubahan',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    custom: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 border border-amber-100',
      iconColor: 'text-amber-500',
      accent: 'border-amber-100',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200',
      defaultLabel: 'Ya, Lanjutkan',
      badge: 'Konfirmasi Aksi',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
  };

  const cfg = config[type] || config.save;
  const Icon = cfg.icon;
  const label = confirmLabel || cfg.defaultLabel;

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl">
        {/* Top accent bar */}
        <div className={`h-1 w-full ${type === 'delete' ? 'bg-red-500' : type === 'update' ? 'bg-blue-500' : type === 'custom' ? 'bg-amber-400' : 'bg-[#0D4F6D]'}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
              <Icon size={22} className={cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badgeClass}`}>
                  {cfg.badge}
                </span>
              </div>
              <h2 className="text-base font-heading font-bold text-foreground leading-tight">{title}</h2>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className={`rounded-xl border ${cfg.accent} bg-muted/30 px-4 py-3 mb-5`}>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          )}

          {/* Warning for delete */}
          {type === 'delete' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 mb-5">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">
                Data yang dihapus <strong>tidak dapat dikembalikan</strong>. Pastikan Anda sudah yakin sebelum melanjutkan.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-10 text-sm font-medium border-border hover:bg-muted/60"
            >
              <X size={14} className="mr-1.5" />
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-10 text-sm font-semibold ${cfg.btnClass}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {type === 'delete' ? <Trash2 size={14} /> : <CheckCircle2 size={14} />}
                  {label}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}