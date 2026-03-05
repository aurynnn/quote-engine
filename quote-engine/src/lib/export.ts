/**
 * Export Utilities for Quote Engine
 * Uses SheetJS (xlsx) for client-side generation
 */

import * as XLSX from 'xlsx';

/**
 * Export quotes to CSV format
 */
export function exportQuotesToCSV(quotes: any[], filename = 'quotes.csv') {
  const data = quotes.map(q => ({
    'Quote Number': q.quoteNumber,
    'Client Name': q.clientName,
    'Client Email': q.clientEmail || '',
    'Status': q.status,
    'Items Count': q.items?.length || 0,
    'Subtotal': q.subtotal?.toFixed(2) || '0.00',
    'Tax': q.tax?.toFixed(2) || '0.00',
    'Total': q.total?.toFixed(2) || '0.00',
    'Generated At': q.generatedAt ? new Date(q.generatedAt).toLocaleDateString() : '',
    'Expires At': q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export quotes to Excel format with formatted sheets
 */
export function exportQuotesToExcel(quotes: any[], filename = 'quotes.xlsx') {
  const workbook = XLSX.utils.book_new();

  // Main quotes summary sheet
  const summaryData = quotes.map(q => ({
    'Quote Number': q.quoteNumber,
    'Client Name': q.clientName,
    'Client Email': q.clientEmail || '',
    'Status': q.status,
    'Items': q.items?.length || 0,
    'Subtotal (€)': q.subtotal?.toFixed(2) || '0.00',
    'Buffer (€)': q.buffer?.toFixed(2) || '0.00',
    'Tax (€)': q.tax?.toFixed(2) || '0.00',
    'Total (€)': q.total?.toFixed(2) || '0.00',
    'Generated': q.generatedAt ? new Date(q.generatedAt).toLocaleDateString() : '',
    'Expires': q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : ''
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 15 }, // Quote Number
    { wch: 20 }, // Client Name
    { wch: 25 }, // Client Email
    { wch: 10 }, // Status
    { wch: 8 },  // Items
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Buffer
    { wch: 10 }, // Tax
    { wch: 12 }, // Total
    { wch: 12 }, // Generated
    { wch: 12 }  // Expires
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Quotes Summary');

  // Individual quote detail sheets
  quotes.forEach((q, idx) => {
    if (q.items && q.items.length > 0) {
      const itemsData = q.items.map((item: any) => ({
        'Item': item.name,
        'Description': item.description || '',
        'Unit': item.unit || '',
        'Quantity': item.quantity || 0,
        'Unit Price (€)': item.unitPrice?.toFixed(2) || '0.00',
        'Total (€)': item.total?.toFixed(2) || '0.00'
      }));

      // Add summary row
      itemsData.push({} as any);
      itemsData.push({ 'Item': 'Subtotal', 'Total (€)': q.subtotal?.toFixed(2) || '0.00' });
      itemsData.push({ 'Item': 'Tax', 'Total (€)': q.tax?.toFixed(2) || '0.00' });
      itemsData.push({ 'Item': 'TOTAL', 'Total (€)': q.total?.toFixed(2) || '0.00' });

      const sheet = XLSX.utils.json_to_sheet(itemsData);
      sheet['!cols'] = [
        { wch: 20 }, // Item
        { wch: 30 }, // Description
        { wch: 10 }, // Unit
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }  // Total
      ];

      // Sanitize sheet name
      const sheetName = `${q.quoteNumber || `Quote_${idx + 1}`}`.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    }
  });

  XLSX.writeFile(workbook, filename);
}

/**
 * Export clients to CSV format
 */
export function exportClientsToCSV(clients: any[], filename = 'clients.csv') {
  const data = clients.map(c => ({
    'Name': c.name,
    'Email': c.email || '',
    'Phone': c.phone || '',
    'Company': c.company || '',
    'Address': c.address || '',
    'Status': c.status || 'active',
    'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export pricing items to CSV format
 */
export function exportPricingToCSV(pricing: any[], filename = 'pricing.csv') {
  const data = pricing.map(p => ({
    'Category': p.category || '',
    'Name': p.name || '',
    'Unit': p.unit || '',
    'Base Price (€)': p.basePrice?.toFixed(2) || '0.00',
    'Min Price (€)': p.minPrice?.toFixed(2) || '0.00',
    'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export pricing items to Excel format
 */
export function exportPricingToExcel(pricing: any[], filename = 'pricing.xlsx') {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = pricing.map(p => ({
    'Category': p.category || '',
    'Name': p.name || '',
    'Unit': p.unit || '',
    'Base Price (€)': p.basePrice?.toFixed(2) || '0.00',
    'Min Price (€)': p.minPrice?.toFixed(2) || '0.00',
    'Margin (%)': p.basePrice && p.minPrice ? (((p.basePrice - p.minPrice) / p.basePrice) * 100).toFixed(1) : '0.0',
    'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 15 }, // Category
    { wch: 25 }, // Name
    { wch: 10 }, // Unit
    { wch: 15 }, // Base Price
    { wch: 15 }, // Min Price
    { wch: 10 }, // Margin
    { wch: 12 }  // Created
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Pricing Items');

  // Group by category
  const categories = [...new Set(pricing.map(p => p.category || 'Uncategorized'))];
  
  categories.forEach(cat => {
    const catItems = pricing.filter(p => (p.category || 'Uncategorized') === cat);
    if (catItems.length > 0) {
      const catData = catItems.map(p => ({
        'Item': p.name || '',
        'Unit': p.unit || '',
        'Base Price (€)': p.basePrice?.toFixed(2) || '0.00',
        'Min Price (€)': p.minPrice?.toFixed(2) || '0.00'
      }));

      const sheet = XLSX.utils.json_to_sheet(catData);
      sheet['!cols'] = [
        { wch: 25 }, // Item
        { wch: 10 }, // Unit
        { wch: 15 }, // Base Price
        { wch: 15 }  // Min Price
      ];

      const sheetName = cat.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    }
  });

  XLSX.writeFile(workbook, filename);
}

/**
 * Batch export multiple quotes as ZIP file
 * Uses JSZip for ZIP creation
 */
export async function exportQuotesBatchZip(quotes: any[], filename = 'quotes_export.zip') {
  // Dynamic import for JSZip (client-side only)
  const JSZip = (await import('jszip')).default;
  const blob = (await import('buffer')).Blob;
  const saveAs = (await import('file-saver')).saveAs;

  const zip = new JSZip();

  // Create CSV summary
  const summaryData = quotes.map(q => ({
    'Quote Number': q.quoteNumber,
    'Client Name': q.clientName,
    'Total (€)': q.total?.toFixed(2) || '0.00'
  }));
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  const summaryCsv = XLSX.utils.sheet_to_csv(summaryWorksheet);
  zip.file('quotes_summary.csv', summaryCsv);

  // Create individual quote files
  for (const q of quotes) {
    const quoteFolder = zip.folder(q.quoteNumber || 'quote');
    if (!quoteFolder) continue;

    // Quote info JSON
    quoteFolder.file('info.json', JSON.stringify({
      quoteNumber: q.quoteNumber,
      clientName: q.clientName,
      clientEmail: q.clientEmail,
      status: q.status,
      total: q.total,
      generatedAt: q.generatedAt
    }, null, 2));

    // Items as CSV
    if (q.items && q.items.length > 0) {
      const itemsData = q.items.map((item: any) => ({
        'Item': item.name,
        'Description': item.description || '',
        'Unit': item.unit || '',
        'Quantity': item.quantity || 0,
        'Unit Price (€)': item.unitPrice?.toFixed(2) || '0.00',
        'Total (€)': item.total?.toFixed(2) || '0.00'
      }));
      const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
      const itemsCsv = XLSX.utils.sheet_to_csv(itemsWorksheet);
      quoteFolder.file('items.csv', itemsCsv);
    }
  }

  // Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, filename);
}

/**
 * Export quotes to formatted Excel with multiple sheets
 */
export function exportQuotesDetailedExcel(quotes: any[], filename = 'quotes_detailed.xlsx') {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = quotes.map(q => ({
    'Quote #': q.quoteNumber,
    'Client': q.clientName,
    'Email': q.clientEmail || '',
    'Status': q.status,
    'Items': q.items?.length || 0,
    'Subtotal': q.subtotal || 0,
    'Tax': q.tax || 0,
    'Total': q.total || 0,
    'Date': q.generatedAt ? new Date(q.generatedAt).toISOString().split('T')[0] : '',
    'Expiry': q.expiresAt ? new Date(q.expiresAt).toISOString().split('T')[0] : ''
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'All Quotes');

  // Status breakdown
  const statuses = ['draft', 'sent', 'accepted', 'rejected'];
  statuses.forEach(status => {
    const statusQuotes = quotes.filter(q => q.status === status);
    if (statusQuotes.length > 0) {
      const data = statusQuotes.map(q => ({
        'Quote #': q.quoteNumber,
        'Client': q.clientName,
        'Total': q.total?.toFixed(2) || '0.00',
        'Date': q.generatedAt ? new Date(q.generatedAt).toLocaleDateString() : ''
      }));
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, status.charAt(0).toUpperCase() + status.slice(1));
    }
  });

  XLSX.writeFile(workbook, filename);
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
