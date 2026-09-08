import { useState } from 'react';
import { Download, FileText, ChevronDown, ChevronUp, Scale, Shield, Database, Clock, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '../contexts/ThemeContext';

// ============================================================
// REGRAS DE HOMOLOGAÇÃO IAC/ANAC - DIÁRIO DE BORDO DIGITAL
// ============================================================

interface RuleSection {
  id: string;
  icon: string;
  title: string;
  regulation: string;
  content: string[];
}

const RULES: RuleSection[] = [
  {
    id: 'fundamentacao',
    icon: '⚖️',
    title: 'Fundamentação Legal',
    regulation: 'Lei nº 7.565/1986 (CBA) - Arts. 66, II e 289, II e III',
    content: [
      'O Diário de Bordo é obrigatório para todas as aeronaves civis brasileiras, conforme Art. 4º, § 2º da Resolução nº 457/2017.',
      'O Código Brasileiro de Aeronáutica (Lei 7.565/1986) estabelece a obrigatoriedade do registro operacional.',
      'O diário de bordo constitui o meio oficial para registro de operações, ações de manutenção e demais informações.',
      'Integra o acervo da aeronave e deve ser mantido por toda a existência da aeronave.',
    ],
  },
  {
    id: 'regulamentacao',
    icon: '📋',
    title: 'Regulamentação Aplicável',
    regulation: 'Resolução nº 773/2025, Portarias 2.050/SPO e 3.220/SPO',
    content: [
      'Resolução ANAC nº 773/2025 - Regulamenta o Diário de Bordo das aeronaves civis brasileiras (vigente desde 01/01/2026).',
      'Portaria nº 2.050/SPO/SAR/2018 - Modelo de referência de diário de bordo em meio físico.',
      'Portaria nº 3.220/SPO/SAR/2019 - Modelo de referência de diário de bordo eletrônico (eDB).',
      'Portaria nº 14.096/SPO/2024 - Atualização das funções a bordo.',
      'Resolução nº 458/2017 - Requisitos para sistemas informatizados.',
      'RBAC nº 91, Seção 91.417 - Manutenção de registros.',
    ],
  },
  {
    id: 'meios',
    icon: '📄',
    title: 'Meios de Registro (Art. 3º, Res. 773)',
    regulation: 'Resolução nº 773/2025, Art. 3º',
    content: [
      'O diário de bordo poderá se constituir em meio físico ou digital.',
      'Deve ser garantida a integridade dos registros.',
      'Devem ser evidenciadas eventuais correções das informações.',
      'Independentemente do meio, deve ser mantido por toda a existência da aeronave e por no mínimo 5 anos e 1 dia após o cancelamento da matrícula no RAB.',
      'Uso de meio digital requer aprovação prévia da ANAC (Art. 4º, Res. 773).',
    ],
  },
  {
    id: 'campos_obrigatorios',
    icon: '✏️',
    title: 'Campos Obrigatórios - Parte I (Registros de Voo)',
    regulation: 'IAC 3151, Cap. 4 / Portaria 3.220/SPO, Arts. 17-45',
    content: [
      '1. Número sequencial cronológico do registro do voo.',
      '2. Número da página do Diário de Bordo.',
      '3. Identificação da aeronave (marcas de nacionalidade e matrícula - ex: PT-ABC).',
      '4. Fabricante, modelo e número de série da aeronave.',
      '5. Categoria de registro da aeronave.',
      '6. Tripulação - nome e código ANAC de cada tripulante com sua função.',
      '7. Data do voo (dia/mês/ano).',
      '8. Local de decolagem e pouso (designativos ICAO).',
      '9. Horário de decolagem e pouso (UTC ou local, com indicação Z para Zulu).',
      '10. Tempo de voo: diurno, noturno, IFR-R (real), IFR-C (sob capota) e total.',
      '11. Ciclos parciais e totais de voo.',
      '12. Número de pousos parciais e totais.',
      '13. Total de combustível existente antes da decolagem.',
      '14. Natureza do voo conforme siglas: PV, FR, TN, TR, CQ, LR, SA, EX, AE, LX, LS, IN.',
      '15. Quantidade de passageiros transportados por etapa.',
      '16. Carga transportada por etapa.',
      '17. Assinatura do comandante (obrigatória para cada etapa).',
      '18. Assinatura/rubrica do mecânico responsável pela liberação (conforme RBAC 43).',
      '19. Ocorrências no voo.',
    ],
  },
  {
    id: 'funcoes_tripulante',
    icon: '👨‍✈️',
    title: 'Funções a Bordo (Portaria 14.096/SPO/2024)',
    regulation: 'Portaria nº 14.096/SPO/2024 - Art. 17, II',
    content: [
      'PIC - Piloto em Comando (Pilot in Command)',
      'SIC - Segundo em Comando (Second in Command)',
      'FI - Flight Instructor (Instrutor de Voo)',
      'FE - Flight Engineer (Engenheiro de Voo)',
      'N1 - Tripulante de Cabine 1º',
      'N2 - Tripulante de Cabine 2º',
      'OBS - Observador',
      'REL - Relief (Descanso)',
      'A função deve ser registrada independentemente de haver campo específico no diário.',
    ],
  },
  {
    id: 'parte2',
    icon: '🔧',
    title: 'Parte II - Situação Técnica da Aeronave',
    regulation: 'IAC 3151, Cap. 5 / Portaria 3.220/SPO, Arts. 42-45',
    content: [
      '1. Tipo da última intervenção de manutenção prevista para a célula.',
      '2. Tipo da próxima intervenção de manutenção prevista.',
      '3. Horas de célula para próxima intervenção de manutenção.',
      '4. Data do registro.',
      '5. Capítulo ATA (SIST).',
      '6. Discrepância técnica verificada.',
      '7. Ação corretiva tomada.',
      '8. Código ANAC e rubrica de quem liberou a aeronave para retorno ao serviço.',
    ],
  },
  {
    id: 'natureza_voo',
    icon: '🎯',
    title: 'Natureza do Voo (Siglas)',
    regulation: 'IAC 3151, Art. 4º / Portaria 2.050/SPO',
    content: [
      'PV - Voo de caráter privado',
      'FR - Voo de fretamento',
      'TN - Voo de treinamento',
      'TR - Voo de traslado da aeronave',
      'CQ - Voo de exame prático (vôo cheque ou recheque)',
      'LR - Voo de linha regular',
      'SA - Voo de serviço aéreo especializado',
      'EX - Voo de experiência',
      'AE - Autorização especial de voo',
      'LX - Voo de linha não regular',
      'LS - Voo de linha suplementar',
      'IN - Voo de instrução para INSPAC',
    ],
  },
  {
    id: 'numeracao',
    icon: '🔢',
    title: 'Numeração do Diário de Bordo',
    regulation: 'IAC 3151, Cap. 7 / Portaria 3.220/SPO, Art. 5º',
    content: [
      'Formato: NN/CC-MMM/AAAA',
      'NN = Número sequencial (001, 002, etc.)',
      'CC = Marcas de nacionalidade e matrícula (sem hífen, ex: PTABC)',
      'MMM = Ano de abertura do volume (3 dígitos)',
      'AAAA = Ano de abertura (4 dígitos)',
      'Exemplo: 001/PTABC/2026 para aeronave PT-ABC aberta em 2026.',
      'Volumes são delimitados por Termo de Abertura e Termo de Encerramento.',
    ],
  },
  {
    id: 'volume',
    icon: '📂',
    title: 'Controle de Volume',
    regulation: 'Portaria 3.220/SPO, Arts. 4º e 6º-7º',
    content: [
      'Volume = conjunto lógico de informações acumuladas em intervalo delimitado por abertura e encerramento.',
      'Termo de Abertura: documento digital assinado pelo operador contendo: Nº do diário, data, páginas, marcas, fabricante, modelo, N/S, horas/ciclos/pousos totais, proprietário/operador.',
      'Termo de Encerramento: documento digital assinado pelo operador contendo: Nº do diário, data, páginas, marcas, fabricante, modelo, N/S, horas/ciclos/pousos totais.',
      'O volume deve ser encerrado no mínimo anualmente.',
    ],
  },
  {
    id: 'digitais',
    icon: '💻',
    title: 'Requisitos para Meio Digital',
    regulation: 'Resolução 458/2017 / Portaria 3.220/SPO',
    content: [
      'Integridade: Registros não podem ser alterados sem rastro de auditoria.',
      'Rastreabilidade: Cada alteração deve registrar quem, quando e o quê.',
      'Autenticação: Somente pessoas autorizadas devem registrar dados.',
      'Assinatura digital: Mecanismo de não-repúdio para o comandante.',
      'Disponibilidade: Sistema acessível para consulta a qualquer momento.',
      'Backup e redundância: Dados devem sobreviver a falhas.',
      'Retenção mínima: 5 anos e 1 dia após cancelamento da matrícula no RAB.',
      'Exportação: Geração de relatório em formato verificável (PDF/CSV mínimo).',
      'Registros dos últimos 30 dias devem estar acessíveis a bordo.',
    ],
  },
  {
    id: 'assinatura',
    icon: '✍️',
    title: 'Assinaturas Digitais',
    regulation: 'Resolução 458/2017, Art. 4º, §§ 1º e 2º',
    content: [
      'O piloto em comando deve assinar todas as informações até o fim da jornada.',
      'Mecanismos aceitos pela ANAC:',
      '  a) Certificados digitais ICP-Brasil (padrão ouro);',
      '  b) Credencial nominal com senha forte + timestamp do servidor;',
      '  c) Autenticação biométrica (digital, facial);',
      '  d) Tokens de segurança ou autenticação multifator.',
      'A assinatura deve registrar timestamp e identidade do signatário.',
      'Após assinatura, o registro fica imutável (locked).',
      'Operador deve adicionalmente assinar em prazos: RBAC 121 (2 dias), RBAC 135 (15 dias).',
    ],
  },
  {
    id: 'aprovacao',
    icon: '✅',
    title: 'Aprovação para Uso Digital',
    regulation: 'Resolução 773, Arts. 4º e 13 / Portaria 3.220/SPO, Art. 48',
    content: [
      'RBAC 91: Solicitar LOA (Letter of Authorization) via SEI.',
      'RBAC 135: Solicitar alteração na Especificação Operativa (EO).',
      'RBAC 121: Solicitar alteração na EO com FOP 119.',
      'Documentação necessária:',
      '  1. Carta de solicitação;',
      '  2. Check-list de conformidade (Res. 458);',
      '  3. Relatório de conformidade do sistema (Art. 3º, Res. 458);',
      '  4. Formulário D-144-01 (Declaração para uso de Registros Digitais).',
      'Prazo de migração: até 30 dias após aprovação.',
      'O software deve estar previamente aprovado pela ANAC ou ter conformidade verificada.',
    ],
  },
  {
    id: 'retencao',
    icon: '🗄️',
    title: 'Guarda e Retenção de Registros',
    regulation: 'Resolução 773, Art. 3º, § 1º / Art. 10',
    content: [
      'O operador será responsável pela guarda e controle do diário de bordo.',
      'Prazo mínimo de retenção: toda a existência da aeronave + 5 anos e 1 dia após cancelamento da matrícula no RAB.',
      'Registros dos últimos 30 dias devem estar disponíveis a bordo.',
      'Após assinatura do piloto, informações digitais devem ser assinadas pelo operador.',
      'Compartilamento digital isenta cumprimento da Resolução 219/2012 (Sistema Eletrônico de Registro de Voo).',
    ],
  },
  {
    id: 'correcoes',
    icon: '🔄',
    title: 'Correções e Alterações',
    regulation: 'Resolução 773, Art. 3º / Resolução 458/2017',
    content: [
      'Eventuais correções devem ser evidenciadas no registro.',
      'Em meio digital: correção deve gerar novo registro vinculado ao original.',
      'O registro original deve ser preservado com indicação de que foi corrigido.',
      'A correção deve conter: motivo, data, responsável e assinatura.',
      'Registros assinados ficam imutáveis; correção cria registro complementar.',
    ],
  },
  {
    id: 'divulgacao',
    icon: '🌐',
    title: 'Compartilhamento com ANAC',
    regulation: 'Resolução 773, Art. 15',
    content: [
      'A disponibilização de acesso a dados por meio digital isenta o cumprimento da Resolução 219/2012.',
      'O sistema deve permitir exportação em formato padrão (PDF e CSV mínimo).',
      'Dados devem ser apresentados em inspeções mediante solicitação.',
      'A ANAC não possui acesso direto e permanente ao sistema.',
    ],
  },
];

export default function ComplianceRules() {
  const { isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (expandedSections.size === RULES.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(RULES.map(r => r.id)));
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const addPageIfNeeded = (neededHeight: number) => {
      if (y + neededHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = margin;
      }
    };

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REGRAS DE HOMOLOGACAO - DIARIO DE BORDO DIGITAL', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Conforme normativa ANAC/ICAO para homologacao de sistemas de registro digital', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} - Diario de Bordo Digital ANAC`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Separator
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    RULES.forEach((section) => {
      addPageIfNeeded(30);

      // Section title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(`${section.icon} ${section.title}`, margin, y);
      y += 5;

      // Regulation reference
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Regulamento: ${section.regulation}`, margin, y);
      y += 5;

      // Content
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      section.content.forEach((line) => {
        addPageIfNeeded(5);
        const splitText = doc.splitTextToSize(line, contentWidth - 5);
        splitText.forEach((textLine: string) => {
          doc.text(textLine, margin + 2, y);
          y += 4;
        });
      });

      y += 4;
    });

    // Footer
    addPageIfNeeded(20);
    y = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Documento gerado pelo sistema Diario de Bordo Digital ANAC. Para homologacao junto a ANAC, consulte a regulamentacao vigente na data de submissao.',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    doc.save('regras-homologacao-diario-bordo-anac.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-7 h-7 text-aviation-accent" />
            Regras de Homologação ANAC
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Regulamentação aplicável ao Diário de Bordo Digital para fins de homologação
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="btn-secondary text-sm">
            {expandedSections.size === RULES.length ? 'Recolher Todas' : 'Expandir Todas'}
          </button>
          <button onClick={generatePDF} className="btn-primary text-sm">
            <Download className="w-4 h-4 inline mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`card text-center p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <FileText className="w-6 h-6 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-blue-600">{RULES.length}</p>
          <p className="text-xs text-slate-500">Seções</p>
        </div>
        <div className={`card text-center p-3 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <Shield className="w-6 h-6 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-green-600">5</p>
          <p className="text-xs text-slate-500">Regulamentos</p>
        </div>
        <div className={`card text-center p-3 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
          <Database className="w-6 h-6 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-purple-600">19</p>
          <p className="text-xs text-slate-500">Campos Obrigatórios</p>
        </div>
        <div className={`card text-center p-3 ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
          <Clock className="w-6 h-6 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold text-orange-600">5+1</p>
          <p className="text-xs text-slate-500">Anos retenção</p>
        </div>
      </div>

      {/* Alert */}
      <div className={`card border-l-4 border-yellow-500 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-600">Aviso Importante</p>
            <p className="text-sm text-slate-600 mt-1">
              Este documento é uma referência das regras aplicáveis. Para homologação formal junto à ANAC,
              consulte sempre a regulamentação vigente na data de submissão e acompanhe eventuais atualizações
              na página oficial da ANAC.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Sections */}
      <div className="space-y-3">
        {RULES.map((section) => (
          <div key={section.id} className="card overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-xs text-slate-500">{section.regulation}</p>
                </div>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSections.has(section.id) && (
              <div className={`px-4 pb-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <ul className="mt-3 space-y-2">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-aviation-accent mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
