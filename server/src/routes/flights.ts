import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { flightRepository, initializeDatabase } from '../database.js';
import { sql } from '../lib/db.js';

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
 * Helper: log de auditoria para CRUD
 */
async function logAudit(userId: string, action: string, entityType: string, entityId: string, oldValues?: any, newValues?: any, ipAddress?: string) {
  try {
    await sql(`
      INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [uuidv4(), userId, action, entityType, entityId, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null, ipAddress || null]);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

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
      userId, tenantId, volumeId,
      flightNumber, flightRules, flightNature,
      date, departureTime, arrivalTime,
      aircraftType, registration, aircraftSerialNumber, registrationCategory,
      departureAirport, arrivalAirport, alternatedAirport,
      flightTypes, flightTime, cycles, totalDistance,
      fuelType, fuelQuantityDeparture, fuelQuantityArrival,
      passengersCount, cargoWeight,
      pilotInCommand, pilotInCommandLicense,
      copilot, copilotLicense, instructor,
      crew, landings, metarDeparture, metarArrival,
      notams, obstacles,
      remarks, status,
      mechanicReleaseCode, mechanicReleaseSignature,
    } = req.body;

    if (!date || !departureTime || !arrivalTime || !aircraftType || !registration || !departureAirport || !arrivalAirport) {
      res.status(400).json({ error: 'Campos obrigatórios não preenchidos (data, horários, aeronave, aeródromos)' });
      return;
    }

    const id = uuidv4();

    // Numeração sequencial automática por volume
    let sequentialNumber = null;
    if (volumeId) {
      sequentialNumber = await flightRepository.getNextSequentialNumber(volumeId);
    }

    const flight = await flightRepository.create({
      userId: userId || 'default',
      tenantId,
      volumeId,
      flightNumber,
      flightRules: flightRules || 'VFR',
      flightNature,
      date,
      departureTime,
      arrivalTime,
      aircraftType,
      registration,
      aircraftSerialNumber,
      registrationCategory,
      departureAirport,
      arrivalAirport,
      alternatedAirport,
      flightTypes: flightTypes || [],
      flightTime: flightTime || { day: 0, night: 0, instrument: 0, crossCountry: 0 },
      cycles,
      totalDistance,
      fuelType,
      fuelQuantityDeparture,
      fuelQuantityArrival,
      passengersCount,
      cargoWeight,
      pilotInCommand: pilotInCommand || '',
      pilotInCommandLicense,
      copilot: copilot || '',
      copilotLicense,
      instructor: instructor || '',
      crew: crew || [],
      landings: landings || { day: 0, night: 0 },
      metarDeparture,
      metarArrival,
      notams,
      obstacles,
      remarks: remarks || '',
      status: status || 'completed',
      mechanicReleaseCode,
      mechanicReleaseSignature,
    }, id);

    // Atualizar sequential_number
    if (sequentialNumber) {
      await sql('UPDATE flights SET sequential_number = $1 WHERE id = $2', [sequentialNumber, id]);
      (flight as any).sequential_number = sequentialNumber;
    }

    // Audit log
    await logAudit(userId || 'default', 'CREATE', 'flight', id, null, { registration, date, departureAirport, arrivalAirport }, req.ip);

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
    const existing = await flightRepository.getById(req.params.id);
    if (existing?.locked) {
      res.status(403).json({ error: 'Voo bloqueado: registro assinado e imutável (Res. 458/2017)' });
      return;
    }

    const oldValues = existing ? { date: existing.date, registration: existing.registration } : null;
    const flight = await flightRepository.update(req.params.id, req.body, req.body.userId);
    if (!flight) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }

    await logAudit(req.body.userId || 'default', 'UPDATE', 'flight', req.params.id, oldValues, { date: flight.date, registration: flight.registration }, req.ip);

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
    const existing = await flightRepository.getById(req.params.id);
    if (existing?.locked) {
      res.status(403).json({ error: 'Voo bloqueado: não é possível excluir registro assinado (Res. 458/2017)' });
      return;
    }

    const oldValues = existing ? { date: existing.date, registration: existing.registration } : null;
    const deleted = await flightRepository.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }

    await logAudit(req.body?.userId || 'default', 'DELETE', 'flight', req.params.id, oldValues, null, req.ip);

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

/**
 * POST /api/flights/:id/sign
 * Assinar voo eletronicamente (trava registro - Res. 458/2017)
 */
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const { userId, signatureData } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId é obrigatório' });
      return;
    }

    const flight = await flightRepository.signFlight(req.params.id, userId, signatureData || 'digital');
    if (!flight) {
      res.status(404).json({ error: 'Voo não encontrado' });
      return;
    }
    res.json(flight);
  } catch (error) {
    console.error('Error signing flight:', error);
    res.status(500).json({ error: 'Erro ao assinar voo' });
  }
});

// ── Volumes do Diário de Bordo (Portaria 3.220/SPO) ──

router.get('/volumes', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const volumes = await flightRepository.getAllVolumes(userId);
    res.json(volumes);
  } catch (error) {
    console.error('Error fetching volumes:', error);
    res.status(500).json({ error: 'Erro ao buscar volumes' });
  }
});

router.get('/volumes/:id', async (req: Request, res: Response) => {
  try {
    const volume = await flightRepository.getVolumeById(req.params.id);
    if (!volume) { res.status(404).json({ error: 'Volume não encontrado' }); return; }
    res.json(volume);
  } catch (error) {
    console.error('Error fetching volume:', error);
    res.status(500).json({ error: 'Erro ao buscar volume' });
  }
});

router.post('/volumes', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const volume = await flightRepository.createVolume(req.body, id);
    res.status(201).json(volume);
  } catch (error) {
    console.error('Error creating volume:', error);
    res.status(500).json({ error: 'Erro ao criar volume' });
  }
});

router.post('/volumes/:id/close', async (req: Request, res: Response) => {
  try {
    const volume = await flightRepository.closeVolume(req.params.id, req.body.signedBy || 'operator');
    if (!volume) { res.status(404).json({ error: 'Volume não encontrado' }); return; }
    res.json(volume);
  } catch (error) {
    console.error('Error closing volume:', error);
    res.status(500).json({ error: 'Erro ao fechar volume' });
  }
});

// ── Manutenção - Parte II (IAC 3151) ──

router.get('/:flightId/maintenance', async (req: Request, res: Response) => {
  try {
    const records = await flightRepository.getMaintenanceByFlightId(req.params.flightId);
    res.json(records);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Erro ao buscar manutenção' });
  }
});

router.post('/:flightId/maintenance', async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const record = await flightRepository.createMaintenance({ ...req.body, flightId: req.params.flightId }, id);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ error: 'Erro ao criar registro de manutenção' });
  }
});

export default router;
