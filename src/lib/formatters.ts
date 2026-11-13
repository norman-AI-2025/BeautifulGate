/**
 * Beautiful Gate Platform Data Normalizers & Formatters
 * Enforces consistent Malaysian Phone Number and IC / NRIC formatting across the platform.
 */

/**
 * Format phone numbers consistently: +60xx-xxxxxxx (or +60xx-xxxxxxxx)
 * e.g. "0176281598" -> "+6017-6281598"
 *      "+60 12-252 3642" -> "+6012-2523642"
 *      "+60169759883" -> "+6016-9759883"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  let digits = cleaned;
  if (digits.startsWith('+60')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('60')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length >= 8) {
    const prefix = digits.slice(0, 2);
    const rest = digits.slice(2);
    return `+60${prefix}-${rest}`;
  }

  return phone.trim();
}

/**
 * Format Malaysian IC / NRIC number to: xxxxxx-xx-xxxx
 * e.g. "060412050245" -> "060412-05-0245"
 *      "730922055206" -> "730922-05-5206"
 */
export function formatICNumber(ic: string | null | undefined): string {
  if (!ic) return '';
  const digits = ic.replace(/[^0-9]/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 12)}`;
  }
  return ic.trim();
}

/**
 * Escapes a cell value for standard CSV formatting.
 * Properly wraps values with quotes, escapes double quotes, and preserves leading zeros / symbols.
 */
export function escapeCSVCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates and triggers download of a clean, professionally formatted CSV table with UTF-8 BOM.
 * BOM (\uFEFF) ensures Excel and spreadsheet readers render characters, currencies, and Chinese text properly.
 */
export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]): void {
  const csvBody = rows
    .map(row => row.map(cell => escapeCSVCell(cell)).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


