import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FlightRecord } from '../types';
import { flightUtils } from '../api/flights';
import type { PilotProfile } from '../api/pilot';

/**
 * Gerar relatório de voos em PDF no formato ANAC
 */
export function generateFlightReport(
  flights: FlightRecord[],
  pilotProfile: PilotProfile | null,
  title: string = 'Relatório de Voo'
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DE BORDO DIGITAL', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Conforme Regulamentação ANAC/ICAO', pageWidth / 2, 22, { align: 'center' });

  // Linha separadora
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(10, 25, pageWidth - 10, 25);

  let y = 32;

  // Dados do Piloto
  if (pilotProfile) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PILOTO', 10, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const pilotData = [
      ['Nome:', pilotProfile.full_name],
      ['Licença:', `${pilotProfile.license_type} - ${pilotProfile.license_number}`],
      ['Médico:', `Classe ${pilotProfile.medical_class} - Válido até ${flightUtils.formatDate(pilotProfile.medical_expiry)}`],
      ['CPF:', pilotProfile.cpf || '-'],
      ['Total de Horas:', `${flightUtils.formatHours(pilotProfile.total_flight_hours)}`],
    ];

    pilotData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 45, y);
      y += 5;
    });

    y += 5;
  }

  // Título do Relatório
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 10, y);
  y += 3;

  // Período
  if (flights.length > 0) {
    const dates = flights.map(f => new Date(f.date).getTime());
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Período: ${flightUtils.formatDate(earliest.toISOString().split('T')[0])} a ${flightUtils.formatDate(latest.toISOString().split('T')[0])}`,
      10, y + 5
    );
    doc.text(`Total de Voos: ${flights.length}`, pageWidth - 10, y + 5, { align: 'right' });
  }

  y += 12;

  // Tabela de Voos
  const tableData = flights.map(flight => [
    flightUtils.formatDate(flight.date),
    flight.departureAirport,
    flight.arrivalAirport,
    flight.registration,
    flight.aircraftType,
    flight.flightTypes.join(', '),
    flightUtils.formatHours(flight.flightTime.day),
    flightUtils.formatHours(flight.flightTime.night),
    flightUtils.formatHours(flight.flightTime.instrument),
    flightUtils.formatHours(flight.flightTime.crossCountry),
    `${flight.landings.day}/${flight.landings.night}`,
    flight.pilotInCommand || '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      'Data', 'Orig', 'Dest', 'Matrícula', 'Aeronave', 'Tipo',
      'Dia', 'Noite', 'Instr', 'X-Country', 'Pousos', 'PIC'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
      8: { cellWidth: 12 },
      9: { cellWidth: 14 },
      10: { cellWidth: 14 },
      11: { cellWidth: 20 },
    },
    margin: { left: 10, right: 10 },
  });

  // Totais
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const totalDay = flights.reduce((sum, f) => sum + f.flightTime.day, 0);
  const totalNight = flights.reduce((sum, f) => sum + f.flightTime.night, 0);
  const totalInstrument = flights.reduce((sum, f) => sum + f.flightTime.instrument, 0);
  const totalXC = flights.reduce((sum, f) => sum + f.flightTime.crossCountry, 0);
  const totalLandingsDay = flights.reduce((sum, f) => sum + f.landings.day, 0);
  const totalLandingsNight = flights.reduce((sum, f) => sum + f.landings.night, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAIS', 10, finalY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const totals = [
    `Dia: ${flightUtils.formatHours(totalDay)}`,
    `Noite: ${flightUtils.formatHours(totalNight)}`,
    `Instrumentos: ${flightUtils.formatHours(totalInstrument)}`,
    `X-Country: ${flightUtils.formatHours(totalXC)}`,
    `Pousos Dia: ${totalLandingsDay}`,
    `Pousos Noite: ${totalLandingsNight}`,
  ];

  let totalsX = 10;
  totals.forEach(total => {
    doc.text(total, totalsX, finalY + 7);
    totalsX += 35;
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(59, 130, 246);
  doc.line(10, footerY - 5, pageWidth - 10, footerY - 5);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Documento gerado pelo Diário de Bordo Digital - ANAC Compliant',
    pageWidth / 2, footerY,
    { align: 'center' }
  );
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    pageWidth / 2, footerY + 5,
    { align: 'center' }
  );
  doc.text(
    'Este documento é uma cópia de segurança. O registro oficial deve seguir o diário homologado pela ANAC.',
    pageWidth / 2, footerY + 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Gerar relatório de um único voo
 */
export function generateSingleFlightReport(
  flight: FlightRecord,
  pilotProfile: PilotProfile | null
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DE BORDO', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Registro de Voo Individual', pageWidth / 2, 22, { align: 'center' });

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(10, 25, pageWidth - 10, 25);

  let y = 35;

  // Dados do Voo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO VOO', 10, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const flightData = [
    ['Data:', flightUtils.formatDate(flight.date)],
    ['Decolagem:', `${flightUtils.formatTime(flight.departureTime)} UTC`],
    ['Pouso:', `${flightUtils.formatTime(flight.arrivalTime)} UTC`],
    ['Aeronave:', `${flight.aircraftType} (${flight.registration})`],
    ['Rota:', `${flight.departureAirport} → ${flight.arrivalAirport}${(flight as any).alternatedAirport ? ` → Alt: ${(flight as any).alternatedAirport}` : ''}`],
    ['Regras de Voo:', (flight as any).flightRules || 'VFR'],
    ['Tipo de Voo:', flight.flightTypes.join(', ')],
    ['Nº do Voo:', (flight as any).flightNumber || '-'],
    ['Distância:', (flight as any).totalDistance ? `${(flight as any).totalDistance} NM` : '-'],
    ['Passageiros:', String((flight as any).passengersCount || 0)],
    ['Combustível:', (flight as any).fuelType || '-'],
    ['Comb. Decolagem:', (flight as any).fuelQuantityDeparture ? `${(flight as any).fuelQuantityDeparture} L/kg` : '-'],
    ['Comb. Pouso:', (flight as any).fuelQuantityArrival ? `${(flight as any).fuelQuantityArrival} L/kg` : '-'],
  ];

  flightData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 45, y);
    y += 6;
  });

  y += 5;

  // Tempo de Voo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TEMPO DE VOO', 10, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Tempo']],
    body: [
      ['Dia', flightUtils.formatHours(flight.flightTime.day)],
      ['Noite', flightUtils.formatHours(flight.flightTime.night)],
      ['Instrumentos', flightUtils.formatHours(flight.flightTime.instrument)],
      ['Entre(cidades)', flightUtils.formatHours(flight.flightTime.crossCountry)],
      ['TOTAL', flightUtils.formatHours(
        flight.flightTime.day + flight.flightTime.night
      )],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'center' },
    },
    margin: { left: 10, right: pageWidth - 110 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Pousos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('POUSOS', 10, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dia: ${flight.landings.day}  |  Noite: ${flight.landings.night}  |  Total: ${flight.landings.day + flight.landings.night}`, 10, y);

  y += 12;

  // Tripulação
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIPLAÇÃO', 10, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`PIC: ${flight.pilotInCommand || '-'}${(flight as any).pilotInCommandLicense ? ` (Lic: ${(flight as any).pilotInCommandLicense})` : ''}`, 10, y);
  y += 6;
  doc.text(`SIC: ${flight.copilot || '-'}${(flight as any).copilotLicense ? ` (Lic: ${(flight as any).copilotLicense})` : ''}`, 10, y);
  y += 6;
  doc.text(`Instrutor: ${flight.instructor || '-'}`, 10, y);

  y += 12;

  // Condições Meteorológicas e NOTAMs (ANAC)
  if ((flight as any).metarDeparture || (flight as any).notams) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDIÇÕES E NOTAMs', 10, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if ((flight as any).metarDeparture) {
      doc.text(`METAR Origem: ${(flight as any).metarDeparture}`, 10, y);
      y += 5;
    }
    if ((flight as any).metarArrival) {
      doc.text(`METAR Destino: ${(flight as any).metarArrival}`, 10, y);
      y += 5;
    }
    if ((flight as any).notams) {
      const notamLines = doc.splitTextToSize(`NOTAMs: ${(flight as any).notams}`, pageWidth - 20);
      doc.text(notamLines, 10, y);
      y += notamLines.length * 5;
    }
    if ((flight as any).obstacles) {
      doc.text(`Obstáculos: ${(flight as any).obstacles}`, 10, y);
      y += 5;
    }
    y += 5;
  }

  // Observações
  if (flight.remarks) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', 10, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(flight.remarks, pageWidth - 20);
    doc.text(lines, 10, y);
  }

  // Dados do Piloto (se disponível)
  if (pilotProfile) {
    const footerY = doc.internal.pageSize.getHeight() - 40;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PILOTO:', 10, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${pilotProfile.full_name} - ${pilotProfile.license_type} ${pilotProfile.license_number}`,
      35, footerY
    );
  }

  // Footer
  const pageFooterY = doc.internal.pageSize.getHeight() - 15;
  // Hash de integridade (Resolução 458/2017)
  if ((flight as any).integrityHash) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hash de Integridade: ${(flight as any).integrityHash}`, 10, pageFooterY - 10);
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Documento gerado conforme Portaria 3.220/SPO/SAR e Resolução 458/2017 - ANAC Compliant',
    pageWidth / 2, pageFooterY,
    { align: 'center' }
  );

  return doc;
}

/**
 * Baixar PDF
 */
export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
