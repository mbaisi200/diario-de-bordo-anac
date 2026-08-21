import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { flightRepository, initializeDatabase } from '../database.js';

const router = Router();

// Initialize database on first use
let dbInitialized = false;
router.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
  next();
});

/**
 * GET /api/flights
 * List all flights for a user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const flights = await flightRepository.getAll(userId);
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Erro ao buscar voos' });
  }
});

/**
 * GET /api/flights/stats
 * Get flight statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const stats = await flightRepository.getStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * GET /api/flights/export
 * Export all flights as JSON
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const data = await flightRepository.exportData(userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="diario-de-bordo-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(data);
  } catch (error) {
    console.error('Error exporting flights:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

/**
 * GET /api/flights/:id
 * Get a single flight by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const flight = await flightRepository.getById(req.params.id);
    if (!flight) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }
    res.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ error: 'Erro ao buscar voo' });
  }
});

/**
 * POST /api/flights
 * Create a new flight
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      userId, tenantId,
      flightNumber, flightRules,
      date, departureTime, arrivalTime,
      aircraftType, registration,
      departureAirport, arrivalAirport, alternatedAirport,
      flightTypes, flightTime, totalDistance,
      fuelType, fuelQuantityDeparture, fuelQuantityArrival,
      passengersCount,
      pilotInCommand, pilotInCommandLicense,
      copilot, copilotLicense, instructor,
      landings, metarDeparture, metarArrival,
      notams, obstacles,
      remarks, status,
    } = req.body;

    // Validate required fields per ANAC
    if (!date || !departureTime || !arrivalTime || !aircraftType || !registration || !departureAirport || !arrivalAirport) {
      res.status(400).json({ error: 'Campos obrigatórios não preenchidos (data, horários, aeronave, aeródromos)' });
      return;
    }

    const id = uuidv4();
    const flight = await flightRepository.create({
      userId: userId || 'default',
      tenantId,
      flightNumber,
      flightRules: flightRules || 'VFR',
      date,
      departureTime,
      arrivalTime,
      aircraftType,
      registration,
      departureAirport,
      arrivalAirport,
      alternatedAirport,
      flightTypes: flightTypes || [],
      flightTime: flightTime || { day: 0, night: 0, instrument: 0, crossCountry: 0 },
      totalDistance,
      fuelType,
      fuelQuantityDeparture,
      fuelQuantityArrival,
      passengersCount,
      pilotInCommand: pilotInCommand || '',
      pilotInCommandLicense,
      copilot: copilot || '',
      copilotLicense,
      instructor: instructor || '',
      landings: landings || { day: 0, night: 0 },
      metarDeparture,
      metarArrival,
      notams,
      obstacles,
      remarks: remarks || '',
      status: status || 'completed',
    }, id);

    res.status(201).json(flight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Erro ao criar voo' });
  }
});

/**
 * PUT /api/flights/:id
 * Update an existing flight
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Check if flight is locked
    const existing = await flightRepository.getById(req.params.id);
    if (existing?.locked) {
      res.status(403).json({ error: 'Voo bloqueado: registro assinado e imutável' });
      return;
    }

    const flight = await flightRepository.update(req.params.id, req.body, req.body.userId);
    if (!flight) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }
    res.json(flight);
  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).json({ error: 'Erro ao atualizar voo' });
  }
});

/**
 * DELETE /api/flights/:id
 * Delete a flight
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await flightRepository.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }
    res.json({ message: 'Voo excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ error: 'Erro ao excluir voo' });
  }
});

/**
 * POST /api/flights/import
 * Import flights from JSON
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { flights } = req.body;
    if (!flights || !Array.isArray(flights)) {
      res.status(400).json({ error: 'Dados inválidos para importação' });
      return;
    }

    const imported = await flightRepository.importData({ flights });
    res.json({ imported });
  } catch (error) {
    console.error('Error importing flights:', error);
    res.status(500).json({ error: 'Erro ao importar dados' });
  }
});

export default router;
