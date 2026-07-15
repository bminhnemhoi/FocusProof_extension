/**
 * FocusProof – CSV Helpers
 * Escape field theo chuẩn RFC 4180: bọc trong dấu nháy kép khi field chứa
 * dấu phẩy / nháy kép / xuống dòng, và nhân đôi nháy kép bên trong.
 */

/**
 * Escape một field CSV. Nhận string/number/boolean; null/undefined → chuỗi rỗng.
 */
export function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Chỉ cần bọc nháy kép khi có ký tự đặc biệt
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
