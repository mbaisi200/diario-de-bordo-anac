import { Router, Request, Response } from 'express';
import { backupService } from '../utils/backup.js';
import { verifyToken } from './auth.js';

const router = Router();

// Middleware de autenticação
function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
  }

  // Adicionar userId ao request
  (req as any).userId = payload.userId;
  (req as any).userRole = payload.role;
  next();
}

/**
 * POST /api/backup/create
 * Criar backup manual
 */
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas admins podem criar backups
    if ((req as any).userRole !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem criar backups' });
      return;
    }

    const filepath = await backupService.createBackup();
    res.json({ 
      message: 'Backup criado com sucesso',
      filepath 
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro ao criar backup' });
  }
});

/**
 * GET /api/backup/list
 * Listar backups disponíveis
 */
router.get('/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas admins podem listar backups
    if ((req as any).userRole !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem listar backups' });
      return;
    }

    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
});

/**
 * POST /api/backup/restore
 * Restaurar backup
 */
router.post('/restore', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas admins podem restaurar backups
    if ((req as any).userRole !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem restaurar backups' });
      return;
    }

    const { filename } = req.body;
    if (!filename) {
      res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      return;
    }

    await backupService.restoreBackup(filename);
    res.json({ message: 'Backup restaurado com sucesso' });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    res.status(500).json({ error: 'Erro ao restaurar backup' });
  }
});

/**
 * POST /api/backup/start-auto
 * Iniciar backup automático
 */
router.post('/start-auto', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas admins podem configurar backup automático
    if ((req as any).userRole !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem configurar backup automático' });
      return;
    }

    const { intervalMs } = req.body;
    backupService.startAutoBackup(intervalMs);
    res.json({ message: 'Backup automático iniciado' });
  } catch (error) {
    console.error('Erro ao iniciar backup automático:', error);
    res.status(500).json({ error: 'Erro ao iniciar backup automático' });
  }
});

/**
 * POST /api/backup/stop-auto
 * Parar backup automático
 */
router.post('/stop-auto', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas admins podem parar backup automático
    if ((req as any).userRole !== 'admin') {
      res.status(403).json({ error: 'Apenas administradores podem parar backup automático' });
      return;
    }

    backupService.stopAutoBackup();
    res.json({ message: 'Backup automático parado' });
  } catch (error) {
    console.error('Erro ao parar backup automático:', error);
    res.status(500).json({ error: 'Erro ao parar backup automático' });
  }
});

export default router;
