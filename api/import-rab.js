import { query } from '../lib/db.js';
import { requireAuth, setCors } from '../lib/auth.js';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { parse } from 'csv-parse';

const CSV_URL =
  'https://www.gov.br/anac/pt-br/acesso-a-informacao/dados-abertos/areas-de-atuacao/aeronaves-1/registro-aeronautico-brasileiro/aeronaves-registradas-no-registro-aeronautico-brasileiro-csv';
const CSV_PATH = '/tmp/aeronaves_rab.csv';
const BATCH = 500;

const COLUNAS = [
  'MARCAS', 'PROPRIETARIOS', 'OPERADORES', 'NR_CERT_MATRICULA', 'NR_SERIE',
  'CD_TIPO', 'DS_MODELO', 'NM_FABRICANTE', 'CD_CLS', 'NR_PMD', 'CD_TIPO_ICAO',
  'NR_TRIPULACAO_MIN', 'NR_PASSAGEIROS_MAX', 'NR_ASSENTOS', 'NR_ANO_FABRICACAO',
  'DT_VALIDADE_CVA', 'DT_VALIDADE_CA', 'DT_CANC', 'DS_MOTIVO_CANC',
  'CD_INTERDICAO', 'DS_GRAVAME', 'DT_MATRICULA', 'TP_MOTOR', 'QT_MOTOR',
  'TP_POUSO', 'TP_CA', 'CD_PROPOSITO_CAVE', 'CF_OPERACIONAL',
  'DS_CATEGORIA_HOMOLOGACAO', 'TP_OPERACAO',
];

function toInt(value) {
  if (value == null || value === '' || value === '-') return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function toPmd(value) {
  if (value == null || value === '' || value === '-') return null;
  let v = value.trim();
  if (v.includes(',')) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (v.includes('.')) {
    const partes = v.split('.');
    const ultimo = partes[partes.length - 1];
    if (ultimo.length === 3) v = v.replace(/\./g, '');
  }
  v = v.replace(/^0+(?=\d)/, '');
  if (v.endsWith('.')) v = v.slice(0, -1);
  const n = Number(v);
  return Number.isNaN(n) ? null : String(n);
}

export default async function handler(req, res) {
  if (!setCors(res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apenas master/admin podem importar
  const user = requireAuth(req, res, ['master', 'admin']);
  if (!user) return;

  try {
    // 1. Baixar CSV da ANAC
    console.log('[RAB] Baixando CSV da ANAC...');
    const fetchRes = await fetch(CSV_URL);
    if (!fetchRes.ok || !fetchRes.body) {
      return res.status(502).json({ error: `Falha ao baixar CSV: ${fetchRes.status}` });
    }
    await mkdir('/tmp', { recursive: true });
    await pipeline(
      Readable.fromWeb(fetchRes.body),
      createWriteStream(CSV_PATH),
    );
    console.log('[RAB] CSV baixado');

    // 2. Garantir que a tabela existe
    await query(`
      CREATE TABLE IF NOT EXISTS aircraft_rab (
        marcas VARCHAR(10) NOT NULL PRIMARY KEY,
        nr_cert_matricula INTEGER,
        nr_serie TEXT,
        cd_tipo TEXT,
        ds_modelo TEXT,
        nm_fabricante TEXT,
        cd_cls TEXT,
        nr_pmd NUMERIC(10,0),
        cd_tipo_icao TEXT,
        nr_tripulacao_min INTEGER,
        nr_passageiros_max INTEGER,
        nr_assentos INTEGER,
        nr_ano_fabricacao INTEGER,
        dt_validade_cva TEXT,
        dt_validade_ca TEXT,
        dt_canc TEXT,
        ds_motivo_canc TEXT,
        cd_interdicao TEXT,
        ds_gravame TEXT,
        dt_matricula TEXT,
        tp_motor TEXT,
        qt_motor INTEGER,
        tp_pouso TEXT,
        tp_ca TEXT,
        cd_proposito_cave TEXT,
        cf_operacional TEXT,
        ds_categoria_homologacao TEXT,
        tp_operacao TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 3. Ler e parsear CSV
    console.log('[RAB] Lendo CSV...');
    const linhas = [];
    const parser = createReadStream(CSV_PATH, { encoding: 'utf-8' }).pipe(
      parse({
        delimiter: ';',
        bom: true,
        skip_empty_lines: true,
        from_line: 3,
        columns: [...COLUNAS],
      }),
    );
    for await (const linha of parser) {
      linhas.push(linha);
    }
    console.log(`[RAB] ${linhas.length} linhas lidas`);

    // 4. Filtrar aeronaves ativas
    const ativas = linhas.filter(l => {
      const canc = (l.DT_CANC || '').trim();
      return !canc || canc === '' || canc === 'ABORDO';
    });
    console.log(`[RAB] ${ativas.length} aeronaves ativas`);

    // 5. Inserir em lotes
    let inseridas = 0;
    for (let i = 0; i < ativas.length; i += BATCH) {
      const lote = ativas.slice(i, i + BATCH);
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const l of lote) {
        const marcas = (l.MARCAS || '').trim().toUpperCase();
        if (!marcas) continue;

        values.push(`($${paramIdx},$${paramIdx+1},$${paramIdx+2},$${paramIdx+3},$${paramIdx+4},$${paramIdx+5},$${paramIdx+6},$${paramIdx+7},$${paramIdx+8},$${paramIdx+9},$${paramIdx+10},$${paramIdx+11},$${paramIdx+12},$${paramIdx+13},$${paramIdx+14},$${paramIdx+15},$${paramIdx+16},$${paramIdx+17},$${paramIdx+18},$${paramIdx+19},$${paramIdx+20},$${paramIdx+21},$${paramIdx+22},$${paramIdx+23},$${paramIdx+24},$${paramIdx+25},$${paramIdx+26},$${paramIdx+27})`);
        params.push(
          marcas,
          toInt(l.NR_CERT_MATRICULA),
          (l.NR_SERIE || '').trim() || null,
          (l.CD_TIPO || '').trim() || null,
          (l.DS_MODELO || '').trim() || null,
          (l.NM_FABRICANTE || '').trim() || null,
          (l.CD_CLS || '').trim() || null,
          toPmd(l.NR_PMD),
          (l.CD_TIPO_ICAO || '').trim() || null,
          toInt(l.NR_TRIPULACAO_MIN),
          toInt(l.NR_PASSAGEIROS_MAX),
          toInt(l.NR_ASSENTOS),
          toInt(l.NR_ANO_FABRICACAO),
          (l.DT_VALIDADE_CVA || '').trim() || null,
          (l.DT_VALIDADE_CA || '').trim() || null,
          (l.DT_CANC || '').trim() || null,
          (l.DS_MOTIVO_CANC || '').trim() || null,
          (l.CD_INTERDICAO || '').trim() || null,
          (l.DS_GRAVAME || '').trim() || null,
          (l.DT_MATRICULA || '').trim() || null,
          (l.TP_MOTOR || '').trim() || null,
          toInt(l.QT_MOTOR),
          (l.TP_POUSO || '').trim() || null,
          (l.TP_CA || '').trim() || null,
          (l.CD_PROPOSITO_CAVE || '').trim() || null,
          (l.CF_OPERACIONAL || '').trim() || null,
          (l.DS_CATEGORIA_HOMOLOGACAO || '').trim() || null,
          (l.TP_OPERACAO || '').trim() || null,
        );
        paramIdx += 28;
      }

      if (values.length > 0) {
        await query(
          `INSERT INTO aircraft_rab (marcas,nr_cert_matricula,nr_serie,cd_tipo,ds_modelo,nm_fabricante,cd_cls,nr_pmd,cd_tipo_icao,nr_tripulacao_min,nr_passageiros_max,nr_assentos,nr_ano_fabricacao,dt_validade_cva,dt_validade_ca,dt_canc,ds_motivo_canc,cd_interdicao,ds_gravame,dt_matricula,tp_motor,qt_motor,tp_pouso,tp_ca,cd_proposito_cave,cf_operacional,ds_categoria_homologacao,tp_operacao)
           VALUES ${values.join(',')}
           ON CONFLICT (marcas) DO UPDATE SET
             nr_cert_matricula = EXCLUDED.nr_cert_matricula,
             nr_serie = EXCLUDED.nr_serie,
             cd_tipo = EXCLUDED.cd_tipo,
             ds_modelo = EXCLUDED.ds_modelo,
             nm_fabricante = EXCLUDED.nm_fabricante,
             cd_cls = EXCLUDED.cd_cls,
             nr_pmd = EXCLUDED.nr_pmd,
             cd_tipo_icao = EXCLUDED.cd_tipo_icao,
             nr_tripulacao_min = EXCLUDED.nr_tripulacao_min,
             nr_passageiros_max = EXCLUDED.nr_passageiros_max,
             nr_assentos = EXCLUDED.nr_assentos,
             nr_ano_fabricacao = EXCLUDED.nr_ano_fabricacao,
             dt_validade_cva = EXCLUDED.dt_validade_cva,
             dt_validade_ca = EXCLUDED.dt_validade_ca,
             dt_canc = EXCLUDED.dt_canc,
             ds_motivo_canc = EXCLUDED.ds_motivo_canc,
             cd_interdicao = EXCLUDED.cd_interdicao,
             ds_gravame = EXCLUDED.ds_gravame,
             dt_matricula = EXCLUDED.dt_matricula,
             tp_motor = EXCLUDED.tp_motor,
             qt_motor = EXCLUDED.qt_motor,
             tp_pouso = EXCLUDED.tp_pouso,
             tp_ca = EXCLUDED.tp_ca,
             cd_proposito_cave = EXCLUDED.cd_proposito_cave,
             cf_operacional = EXCLUDED.cf_operacional,
             ds_categoria_homologacao = EXCLUDED.ds_categoria_homologacao,
             tp_operacao = EXCLUDED.tp_operacao,
             updated_at = NOW()`,
          params,
        );
        inseridas += values.length;
      }
    }

    // 6. Contar total
    const [{ total }] = await query('SELECT COUNT(*) as total FROM aircraft_rab');

    console.log(`[RAB] Concluído! ${inseridas} inseridas, ${total} total`);

    return res.status(200).json({
      success: true,
      imported: inseridas,
      total,
      message: `Importação concluída. ${inseridas} aeronaves processadas, ${total} no total.`,
    });
  } catch (error) {
    console.error('[RAB] Erro na importação:', error);
    return res.status(500).json({ error: 'Erro na importação do RAB', details: error.message });
  }
}
