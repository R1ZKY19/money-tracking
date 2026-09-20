import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportReportCSV, exportReportPDF } from '@/components/report/reportExport';

export default function ReportExportMenu({ report }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl"><Download size={14} /> Export Laporan</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportReportPDF(report)} className="gap-2 cursor-pointer"><FileText size={14} className="text-red-500" /> Export PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportReportCSV(report)} className="gap-2 cursor-pointer"><FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV / Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}