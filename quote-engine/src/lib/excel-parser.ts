// Lazy-load xlsx to reduce initial bundle size
let xlsx: typeof import('xlsx') | null = null;

async function getXLSX() {
  if (!xlsx) {
    xlsx = await import('xlsx');
  }
  return xlsx;
}

import type { PriceItem } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ParsedRow {
  category: string;
  name: string;
  unit: string;
  basePrice: number;
  minPrice: number;
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedRow[];
  errors: string[];
  rowCount: number;
}

/**
 * Parse Excel file buffer to structured JSON
 */
export async function parseExcelFile(buffer: Buffer): Promise<ExcelParseResult> {
  const errors: string[] = [];
  
  try {
    const XLSX = await getXLSX();
    
    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      raw: false,
      defval: ''
    }) as Record<string, unknown>[];
    
    if (!jsonData || jsonData.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['No data found in Excel file'],
        rowCount: 0
      };
    }
    
    // Map to our structure - try common column names
    const parsedRows: ParsedRow[] = jsonData.map((row, index) => {
      const category = String(row.category || row.Category || row.cat || row.type || row.Type || '').trim();
      const name = String(row.name || row.Name || row.item || row.Item || row.description || row.Description || '').trim();
      const unit = String(row.unit || row.Unit || row.measure || row.Measure || 'item').trim();
      const basePrice = parseFloat(String(row.price || row.Price || row.basePrice || row.base_price || row.cost || row.Cost || '0'));
      const minPrice = parseFloat(String(row.minPrice || row.min_price || row.minPrice || row.min || '0'));
      
      if (!category || !name) {
        errors.push(`Row ${index + 2}: Missing category or name`);
      }
      
      if (isNaN(basePrice)) {
        errors.push(`Row ${index + 2}: Invalid price`);
      }
      
      return {
        category: category || 'Uncategorized',
        name: name || 'Unknown',
        unit: unit || 'item',
        basePrice: isNaN(basePrice) ? 0 : basePrice,
        minPrice: isNaN(minPrice) ? basePrice * 0.8 : minPrice
      };
    }).filter(row => row.name !== 'Unknown');
    
    return {
      success: true,
      data: parsedRows,
      errors,
      rowCount: parsedRows.length
    };
    
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Failed to parse Excel: ${error}`],
      rowCount: 0
    };
  }
}

/**
 * Convert parsed rows to PriceItem objects
 */
export function toPriceItems(rows: ParsedRow[], userId: string | ObjectId): Omit<PriceItem, '_id'>[] {
  const oid = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const now = new Date();
  
  return rows.map(row => ({
    userId: oid,
    category: row.category,
    name: row.name,
    unit: row.unit,
    basePrice: row.basePrice,
    minPrice: row.minPrice,
    multiplier: {},
    createdAt: now,
    updatedAt: now
  }));
}

/**
 * Create sample Excel template
 */
export async function createSampleTemplate(): Promise<Buffer> {
  const XLSX = await getXLSX();
  
  const data = [
    { category: 'Labor', name: 'Web Development', unit: 'hour', basePrice: 75, minPrice: 60 },
    { category: 'Labor', name: 'UI/UX Design', unit: 'hour', basePrice: 85, minPrice: 70 },
    { category: 'Labor', name: 'Project Management', unit: 'hour', basePrice: 50, minPrice: 40 },
    { category: 'Materials', name: 'Server Setup', unit: 'item', basePrice: 150, minPrice: 100 },
    { category: 'Materials', name: 'SSL Certificate', unit: 'item', basePrice: 50, minPrice: 35 },
    { category: 'Services', name: 'SEO Optimization', unit: 'page', basePrice: 100, minPrice: 80 },
    { category: 'Services', name: 'Content Writing', unit: 'word', basePrice: 0.10, minPrice: 0.05 },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing');
  
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
