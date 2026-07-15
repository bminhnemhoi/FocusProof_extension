/**
 * Unit tests cho csv.ts – csvEscape theo chuẩn RFC 4180.
 */

import { describe, it, expect } from 'vitest';
import { csvEscape } from '@/utils/csv';

describe('csvEscape', () => {
  it('giữ nguyên chuỗi thường không có ký tự đặc biệt', () => {
    expect(csvEscape('Học toán')).toBe('Học toán');
    expect(csvEscape('docs.google.com')).toBe('docs.google.com');
  });

  it('bọc nháy kép khi field chứa dấu phẩy', () => {
    expect(csvEscape('Học toán, lý, hóa')).toBe('"Học toán, lý, hóa"');
  });

  it('nhân đôi dấu nháy kép bên trong và bọc field', () => {
    expect(csvEscape('Bài "quan trọng"')).toBe('"Bài ""quan trọng"""');
  });

  it('xử lý field chứa cả nháy kép lẫn dấu phẩy', () => {
    expect(csvEscape('Đọc "Dế Mèn", chương 1')).toBe('"Đọc ""Dế Mèn"", chương 1"');
  });

  it('bọc nháy kép khi field chứa xuống dòng', () => {
    expect(csvEscape('dòng 1\ndòng 2')).toBe('"dòng 1\ndòng 2"');
    expect(csvEscape('dòng 1\r\ndòng 2')).toBe('"dòng 1\r\ndòng 2"');
  });

  it('chuyển number/boolean thành chuỗi', () => {
    expect(csvEscape(42)).toBe('42');
    expect(csvEscape(true)).toBe('true');
    expect(csvEscape(false)).toBe('false');
  });

  it('null/undefined → chuỗi rỗng', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('một dòng CSV ghép từ field đã escape parse lại đúng số cột', () => {
    const fields = ['id-1', 'Task "A", phần 2', 'study', '85'];
    const row = fields.map(csvEscape).join(',');
    // Đếm dấu phẩy ngoài nháy kép — phải đúng 3 (4 cột)
    let inQuotes = false;
    let commas = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') inQuotes = !inQuotes;
      else if (row[i] === ',' && !inQuotes) commas++;
    }
    expect(commas).toBe(3);
  });
});
