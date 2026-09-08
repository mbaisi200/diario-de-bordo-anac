import { describe, it, expect } from 'vitest';
import { generateComplianceReport } from '../utils/complianceReport';

describe('complianceReport', () => {
  it('should generate a PDF document', () => {
    const doc = generateComplianceReport();
    expect(doc).toBeDefined();
    expect(typeof doc.save).toBe('function');
  });

  it('should have multiple pages', () => {
    const doc = generateComplianceReport();
    const pageCount = doc.getNumberOfPages();
    expect(pageCount).toBeGreaterThan(1);
  });

  it('should output a valid PDF buffer', () => {
    const doc = generateComplianceReport();
    const output = doc.output('arraybuffer');
    expect(output).toBeInstanceOf(ArrayBuffer);
    expect(output.byteLength).toBeGreaterThan(0);
  });

  it('should have correct page dimensions', () => {
    const doc = generateComplianceReport();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    expect(pageWidth).toBeCloseTo(210, 0); // A4 width
    expect(pageHeight).toBeCloseTo(297, 0); // A4 height
  });
});
