import { sql } from '../lib/db.js';
import { encryptBackup, decryptBackup } from './encryption.js';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const BACKUP_INTERVAL_MS = parseInt(process.env.BACKUP_INTERVAL_MS || '3600000'); // 1 hour default

/**
 * Serviço de Backup Automático
 * Conforme Resolução 458/2017 - Backup e Redundância
 */
export class BackupService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Garantir que o diretório de backup existe
   */
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Criar backup completo do banco de dados
   */
  async createBackup(): Promise<string> {
    await this.ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.enc`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log(`[Backup] Iniciando backup em ${timestamp}...`);

    // Extrair todos os dados do banco
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {} as Record<string, any[]>,
    };

    // Tabelas para backup
    const tables = [
      'users',
      'flights',
      'pilot_profiles',
      'aircraft',
      'audit_logs',
      'signatures',
      'approvals',
      'logbook_volumes',
      'crew_members',
      'aircraft_maintenance',
    ];

    for (const table of tables) {
      try {
        const rows = await sql(`SELECT * FROM ${table}`);
        data.tables[table] = rows;
        console.log(`[Backup] Tabela ${table}: ${rows.length} registros`);
      } catch (error) {
        console.warn(`[Backup] Tabela ${table} não encontrada, pulando...`);
      }
    }

    // Serializar e criptografar
    const jsonData = JSON.stringify(data, null, 2);
    const encrypted = encryptBackup(jsonData);

    // Salvar arquivo
    await fs.writeFile(filepath, encrypted);

    const stats = await fs.stat(filepath);
    console.log(`[Backup] Backup concluído: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);

    // Limpar backups antigos (manter últimos 7 dias)
    await this.cleanOldBackups();

    return filepath;
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(filename: string): Promise<void> {
    const filepath = path.join(BACKUP_DIR, filename);

    console.log(`[Backup] Restaurando backup: ${filename}...`);

    // Ler e descriptografar
    const encrypted = await fs.readFile(filepath);
    const jsonData = decryptBackup(encrypted);
    const data = JSON.parse(jsonData);

    // Restaurar cada tabela
    for (const [table, rows] of Object.entries(data.tables)) {
      if (Array.isArray(rows) && rows.length > 0) {
        try {
          // Limpar tabela existente
          await sql(`DELETE FROM ${table}`);

          // Inserir dados do backup
          for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

            await sql(
              `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            );
          }

          console.log(`[Backup] Tabela ${table}: ${rows.length} registros restaurados`);
        } catch (error) {
          console.error(`[Backup] Erro ao restaurar tabela ${table}:`, error);
        }
      }
    }

    console.log('[Backup] Restauração concluída!');
  }

  /**
   * Listar backups disponíveis
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
    await this.ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.enc')) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
        });
      }
    }

    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Limpar backups antigos (manter últimos 7 dias)
   */
  private async cleanOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const backup of backups) {
      if (backup.created < sevenDaysAgo) {
        const filepath = path.join(BACKUP_DIR, backup.filename);
        await fs.unlink(filepath);
        console.log(`[Backup] Backup antigo removido: ${backup.filename}`);
      }
    }
  }

  /**
   * Iniciar backup automático periódico
   */
  startAutoBackup(intervalMs: number = BACKUP_INTERVAL_MS): void {
    if (this.intervalId) {
      console.log('[Backup] Backup automático já está em execução');
      return;
    }

    console.log(`[Backup] Iniciando backup automático a cada ${intervalMs / 1000 / 60} minutos`);

    this.intervalId = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('[Backup] Erro no backup automático:', error);
      }
    }, intervalMs);

    // Criar backup inicial
    this.createBackup().catch(console.error);
  }

  /**
   * Parar backup automático
   */
  stopAutoBackup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Backup] Backup automático parado');
    }
  }
}

// Instância singleton
export const backupService = new BackupService();
