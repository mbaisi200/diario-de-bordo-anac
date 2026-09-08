import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FlightCard from '../components/FlightCard';
import type { FlightRecord } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';

const mockFlight: FlightRecord = {
  id: '1',
  userId: 'user1',
  date: '2024-01-15',
  departureTime: '14:00',
  arrivalTime: '16:30',
  aircraftType: 'Cessna 172 Skyhawk',
  registration: 'PT-ABC',
  departureAirport: 'SBGR',
  arrivalAirport: 'SBGL',
  flightTypes: ['pic', 'cross_country'],
  flightTime: { day: 2.5, night: 0, instrument: 0, crossCountry: 2.5 },
  pilotInCommand: 'João Silva',
  copilot: '',
  instructor: '',
  landings: { day: 2, night: 0 },
  remarks: 'Voo de ida ao RJ',
  status: 'completed',
  signed: false,
  locked: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T16:30:00Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('FlightCard', () => {
  it('should render flight registration', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('PT-ABC')).toBeInTheDocument();
  });

  it('should render aircraft type', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('Cessna 172 Skyhawk')).toBeInTheDocument();
  });

  it('should render departure and arrival airports', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('SBGR')).toBeInTheDocument();
    expect(screen.getByText('SBGL')).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
  });

  it('should render flight time', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('02:30')).toBeInTheDocument();
  });

  it('should render total landings', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render flight types', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    expect(screen.getByText('PIC')).toBeInTheDocument();
    expect(screen.getByText('X-Country')).toBeInTheDocument();
  });

  it('should show signed badge when flight is signed', () => {
    const signedFlight = { ...mockFlight, signed: true };
    renderWithProviders(<FlightCard flight={signedFlight} />);
    expect(screen.getByText('✓ Assinado')).toBeInTheDocument();
  });

  it('should have link to flight details', () => {
    renderWithProviders(<FlightCard flight={mockFlight} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/flights/1');
  });
});
