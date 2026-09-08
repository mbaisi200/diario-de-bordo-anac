import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Download, Upload, FileText } from 'lucide-react';
import type { FlightRecord } from '../types';
import FlightList from '../components/FlightList';
import { flightApi } from '../api/flights';
import { pilotApi, PilotProfile } from '../api/pilot';
import { generateFlightReport, downloadPdf } from '../utils/pdfReport';

export default function FlightListPage() {
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pilotProfile, setPilotProfile] = useState<PilotProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [flightsData, profile] = await Promise.all([
        flightApi.getFlights(),
        pilotApi.getProfile().catch(() => null),
      ]);
      setFlights(flightsData);
      setPilotProfile(profile);
    } catch (e) {
      console.error('Erro ao carregar voos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await flightApi.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diario-de-bordo-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await flightApi.importData(data);
        alert('Dados importados com sucesso!');
        loadData();
      } catch (err) {
        alert('Erro ao importar dados');
      }
    };
    input.click();
  };

  const handleExportPdf = () => {
    const doc = generateFlightReport(flights, pilotProfile, 'Relatório de Voos');
    downloadPdf(doc, `diario-de-bordo-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Voos</h1>
          <p className="text-gray-400">
            {flights.length} voo(s) registrado(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar JSON
          </button>
          <button
            onClick={handleExportPdf}
            className="btn-secondary inline-flex items-center border-green-500 text-green-400 hover:bg-green-900/30"
          >
            <FileText className="w-5 h-5 mr-2" />
            Exportar PDF
          </button>
          <button
            onClick={handleImport}
            className="btn-secondary inline-flex items-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            Importar
          </button>
          <Link
            to="/new-flight"
            className="btn-primary inline-flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Novo Voo
          </Link>
        </div>
      </div>

      {/* Flight List */}
      <FlightList flights={flights} isLoading={isLoading} />
    </div>
  );
}
