import { describe, it, expect } from 'vitest';
import { flightUtils } from '../api/flights';

describe('flightUtils', () => {
  describe('formatHours', () => {
    it('should format decimal hours to HH:MM', () => {
      expect(flightUtils.formatHours(1.5)).toBe('01:30');
      expect(flightUtils.formatHours(0)).toBe('00:00');
      expect(flightUtils.formatHours(2.75)).toBe('02:45');
      expect(flightUtils.formatHours(10.5)).toBe('10:30');
    });

    it('should handle negative values', () => {
      expect(flightUtils.formatHours(-1.5)).toBe('-2:30');
    });
  });

  describe('formatDate', () => {
    it('should format date string to DD/MM/YYYY', () => {
      expect(flightUtils.formatDate('2024-01-15')).toBe('15/01/2024');
      expect(flightUtils.formatDate('2024-12-31')).toBe('31/12/2024');
    });
  });

  describe('formatTime', () => {
    it('should format time string to HH:MM', () => {
      expect(flightUtils.formatTime('14:30')).toContain('14:30');
      expect(flightUtils.formatTime('08:00')).toContain('08:00');
    });
  });

  describe('calculateTotalFlightTime', () => {
    it('should calculate total flight time', () => {
      expect(flightUtils.calculateTotalFlightTime({ day: 1.5, night: 0.5, instrument: 0, crossCountry: 0 })).toBe(2);
      expect(flightUtils.calculateTotalFlightTime({ day: 0, night: 0, instrument: 0, crossCountry: 0 })).toBe(0);
      expect(flightUtils.calculateTotalFlightTime({ day: 2.5, night: 1.5, instrument: 1, crossCountry: 2 })).toBe(4);
    });
  });

  describe('calculateTotalLandings', () => {
    it('should calculate total landings', () => {
      expect(flightUtils.calculateTotalLandings({ day: 3, night: 1 })).toBe(4);
      expect(flightUtils.calculateTotalLandings({ day: 0, night: 0 })).toBe(0);
    });
  });
});
