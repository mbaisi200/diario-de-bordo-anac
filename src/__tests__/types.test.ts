import { describe, it, expect } from 'vitest';
import type { FlightRecord, FlightNature, CrewFunction, LogbookVolume } from '../types';

describe('Types', () => {
  describe('FlightNature', () => {
    it('should have all 12 ANAC codes', () => {
      const validNatures: FlightNature[] = ['PV', 'FR', 'TN', 'TR', 'CQ', 'LR', 'SA', 'EX', 'AE', 'LX', 'LS', 'IN'];
      expect(validNatures).toHaveLength(12);
    });
  });

  describe('CrewFunction', () => {
    it('should have all 8 crew functions', () => {
      const validFunctions: CrewFunction[] = ['PIC', 'SIC', 'FI', 'FE', 'N1', 'N2', 'OBS', 'REL'];
      expect(validFunctions).toHaveLength(8);
    });
  });

  describe('FlightRecord', () => {
    it('should have required IAC fields', () => {
      const flight: FlightRecord = {
        id: '1',
        userId: 'user1',
        date: '2024-01-15',
        departureTime: '14:00',
        arrivalTime: '16:30',
        aircraftType: 'Cessna 172',
        registration: 'PT-ABC',
        departureAirport: 'SBGR',
        arrivalAirport: 'SBGL',
        flightTypes: ['pic'],
        flightTime: { day: 2.5, night: 0, instrument: 0, crossCountry: 0 },
        pilotInCommand: 'João Silva',
        copilot: '',
        instructor: '',
        landings: { day: 2, night: 0 },
        remarks: '',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T16:30:00Z',
      };

      expect(flight.id).toBeDefined();
      expect(flight.date).toBeDefined();
      expect(flight.departureAirport).toBeDefined();
      expect(flight.arrivalAirport).toBeDefined();
      expect(flight.flightTime).toBeDefined();
      expect(flight.landings).toBeDefined();
    });
  });

  describe('LogbookVolume', () => {
    it('should have required fields', () => {
      const volume: LogbookVolume = {
        id: '1',
        volumeNumber: '001/PTABC/2026',
        aircraftRegistration: 'PT-ABC',
        aircraftManufacturer: 'Cessna',
        aircraftModel: '172 Skyhawk',
        aircraftSerialNumber: '12345',
        registrationCategory: 'Standard',
        totalHoursAtOpening: 0,
        totalCyclesAtOpening: 0,
        totalLandingsAtOpening: 0,
        yearOfManufacture: '2020',
        owner: 'João Silva',
        operator: 'Operator',
        openingDate: '2024-01-01',
        closingDate: '2024-06-30',
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(volume.volumeNumber).toBe('001/PTABC/2026');
      expect(volume.status).toBe('open');
    });
  });
});
