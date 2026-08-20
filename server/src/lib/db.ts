import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

/**
 * Conexão com o Neon PostgreSQL
 * Usa o driver serverless para eficiência em conexões HTTP
 */
export const sql = neon(process.env.DATABASE_URL);

/**
 * Função auxiliar para executar queries
 */
export async function query<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await sql(query, params || []);
    return result as T[];
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}

/**
 * Função para executar queries de inserção/atualização
 */
export async function execute(query: string, params?: any[]): Promise<{ rowCount: number }> {
  try {
    const result = await sql(query, params || []);
    return { rowCount: result.length };
  } catch (error) {
    console.error('Erro na execução:', error);
    throw error;
  }
}
