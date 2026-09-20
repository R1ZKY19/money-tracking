import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allData, dateStr } = await req.json();

    // Build workbook data with proper formatting
    let xlsxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xlsxContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xlsxContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n';
    xlsxContent += '<Styles>\n';
    xlsxContent += '<Style ss:ID="Header"><Font ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/><Interior ss:Color="#0D4F6D" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/></Borders></Style>\n';
    xlsxContent += '<Style ss:ID="Data"><Borders><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/></Borders><Alignment ss:Horizontal="Left" ss:Vertical="Top"/></Style>\n';
    xlsxContent += '<Style ss:ID="Number"><NumberFormat ss:Format="0;-0"/><Borders><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/></Borders><Alignment ss:Horizontal="Right"/></Style>\n';
    xlsxContent += '</Styles>\n';

    // Create sheets for each data module
    const modules = Object.entries(allData)
      .filter(([, rows]) => rows && rows.length > 0)
      .sort();

    for (const [moduleName, rows] of modules) {
      if (!rows.length) continue;

      const sheetName = moduleName.replace(/\//g, '_').substring(0, 31); // Excel sheet name limit
      xlsxContent += `<Worksheet ss:Name="${sheetName}">\n`;
      xlsxContent += '<Table>\n';

      const keys = Object.keys(rows[0]);
      
      // Header row
      xlsxContent += '<Row>\n';
      for (const key of keys) {
        xlsxContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(key)}</Data></Cell>\n`;
      }
      xlsxContent += '</Row>\n';

      // Data rows
      for (const row of rows) {
        xlsxContent += '<Row>\n';
        for (const key of keys) {
          const value = row[key];
          const isNumber = typeof value === 'number' && !isNaN(value);
          const cellType = isNumber ? 'Number' : 'String';
          const styleId = isNumber ? 'Number' : 'Data';
          xlsxContent += `<Cell ss:StyleID="${styleId}"><Data ss:Type="${cellType}">${escapeXml(String(value ?? ''))}</Data></Cell>\n`;
        }
        xlsxContent += '</Row>\n';
      }

      xlsxContent += '</Table>\n';
      xlsxContent += '</Worksheet>\n';
    }

    xlsxContent += '</Workbook>';

    const encoder = new TextEncoder();
    const bytes = encoder.encode(xlsxContent);

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="fincat-backup-${dateStr}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}