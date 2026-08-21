import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import flightsRouter from './routes/flights.js';
import authRouter from './routes/auth.js';
import auditRouter from './routes/audit.js';
import pilotRouter from './routes/pilot.js';
import masterRouter from './routes/master.js';
import adminRouter from './routes/admin.js';
import referenceDataRouter from './routes/reference-data.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/pilot', pilotRouter);
app.use('/api/master', masterRouter);
app.use('/api/admin', adminRouter);
app.use('/api', referenceDataRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { sql } = await import('./lib/db.js');
    const result = await sql('SELECT NOW() as now');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database_time: result[0]?.now
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Start server
async function startServer() {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`
  ✈️  Diário de Bordo Digital - Servidor ANAC
  ============================================
  🚀 Servidor rodando em http://localhost:${PORT}
  📡 API disponível em http://localhost:${PORT}/api
  💾 Banco de dados: Neon PostgreSQL
  ============================================
  `);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
