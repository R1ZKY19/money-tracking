import React, { useState } from "react";
import * as Entities from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import {
  Download, X, CheckCircle2, Loader2, FileDown, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MODULES = [
  { key: "Transaction",       label: "Transaksi" },
  { key: "Account",           label: "Akun/Saldo" },
  { key: "Debt",              label: "Hutang" },
  { key: "DebtPayment",       label: "Pembayaran Hutang" },
  { key: "Receivable",        label: "Piutang" },
  { key: "ReceivablePayment", label: "Pembayaran Piutang" },
  { key: "SavingTarget",      label: "Tabungan" },
  { key: "BudgetPlan",        label: "Budget Plan" },
  { key: "Category",          label: "Kategori" },
  { key: "ActivityLog",       label: "Log Aktivitas" },
];

export default function GlobalDataManager() {
  const { user } = useAuth();
  const uid = user?.id;
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleExport = async (format) => {
    if (!uid) return;
    setExporting(true);
    setExportDone(false);
    try {
      const allData = {};
      
      // Fetch ALL data
      await Promise.all(
        MODULES.map(async ({ key, label }) => {
          try {
            const entity = Entities[key];
            const rows = entity ? await entity.list({ limit: 5000 }) : [];
            allData[label] = rows;
          } catch { allData[label] = []; }
        })
      );

      const dateStr = new Date().toISOString().slice(0, 10);

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moneytracking-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportDone(true);
    } finally {
      setExporting(false);
    }
  };



  return (
    <>
      {/* Trigger button — export only */}
      <button
        onClick={() => { setOpen(true); setExportDone(false); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:text-emerald-300 hover:bg-white/10 transition-all text-xs w-full"
        title="Export Data"
      >
        <Database size={13} />
        <span>Export Data</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground text-sm">Kelola Data</h2>
                <p className="text-[10px] text-muted-foreground">Export Excel/JSON · Import JSON</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* ── EXPORT ONLY ── */}
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">✅ Export Semua Data</p>
                    <p className="text-[11px] text-muted-foreground">Semua data Anda akan diekspor dalam format yang rapi dan terstruktur per modul.</p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground mb-2">Modul yang akan di-export:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {MODULES.map(m => (
                        <div key={m.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {m.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {exportDone && (
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> File berhasil diunduh!
                    </div>
                  )}

                  {exporting && (
                    <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 shrink-0">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-20 blur-lg animate-pulse" />
                          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="url(#grad)" strokeWidth="2" strokeDasharray="14 20" />
                            <defs>
                              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                <stop offset="100%" stopColor="hsl(var(--accent))" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">🔄 Sedang mengekspor data...</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Mengumpulkan dan memformat semua transaksi</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }} />
                      </div>
                    </div>
                  )}

                  {!exporting && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => handleExport("xlsx")} disabled={exporting} variant="outline" className="gap-2 border-primary/40 text-primary">
                        <FileDown className="w-3.5 h-3.5" />
                        Export Excel
                      </Button>
                      <Button onClick={() => handleExport("json")} disabled={exporting} className="gap-2 bg-primary">
                        <Download className="w-3.5 h-3.5" />
                        Export JSON
                      </Button>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">📊 Excel = format rapi per sheet, bisa dibaca/edit di Microsoft Excel · 📋 JSON = backup lengkap</p>
                  </div>
          </div>
        </div>
      )}
    </>
  );
}