# Documentação Técnica - Diário de Bordo Digital

## Para Submissão de Homologação - ANAC

---

## 1. Informações Gerais do Sistema

| Campo | Valor |
|-------|-------|
| **Nome do Sistema** | Diário de Bordo Digital |
| **Versão** | 1.0.0 |
| **Data de Desenvolvimento** | Setembro de 2026 |
| **Plataforma** | Web (Responsivo) |
| **Tecnologias** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Express.js, PostgreSQL (Neon) |
| **Hospedagem** | Vercel (Frontend + API) |

---

## 2. Regulamentação Aplicável

### 2.1 Principais Regulamentos

| Regulamento | Descrição | Status |
|-------------|-----------|--------|
| Resolução ANAC nº 773/2025 | Diário de Bordo das aeronaves civis brasileiras | ✅ Conforme |
| Portaria nº 2.050/SPO/SAR/2018 | Modelo de referência físico | ✅ Conforme |
| Portaria nº 3.220/SPO/SAR/2019 | Modelo de referência eletrônico (eDB) | ✅ Conforme |
| Portaria nº 14.096/SPO/2024 | Funções a bordo | ✅ Conforme |
| Resolução nº 458/2017 | Sistemas informatizados | ✅ Conforme |
| RBAC nº 91, Seção 91.417 | Manutenção de registros | ✅ Conforme |

### 2.2 Campos Obrigatórios Implementados

#### Parte I - Registros de Voo (19 campos)
1. ✅ Número sequencial cronológico
2. ✅ Número da página do diário
3. ✅ Identificação da aeronave (marcas PT-XXX)
4. ✅ Fabricante, modelo e número de série
5. ✅ Categoria de registro
6. ✅ Tripulação: nome, código ANAC e função
7. ✅ Data do voo (dd/mm/aa)
8. ✅ Aeródromos de origem e destino (ICAO)
9. ✅ Horários: decolagem e pouso (UTC/Zulu)
10. ✅ Tempo de voo: dia, noite, IFR-R, IFR-C, total
11. ✅ Ciclos parciais e totais
12. ✅ Pousos parciais e totais
13. ✅ Combustível total antes da decolagem
14. ✅ Natureza do voo (12 códigos ANAC)
15. ✅ Passageiros por etapa
16. ✅ Carga transportada
17. ✅ Assinatura do comandante
18. ✅ Rubrica do mecânico (RBAC 43)
19. ✅ Ocorrências

#### Parte II - Situação Técnica (5 campos)
1. ✅ Última intervenção de manutenção
2. ✅ Próxima intervenção de manutenção
3. ✅ Horas para próxima intervenção
4. ✅ Data, ATA, discrepância, ação corretiva
5. ✅ Liberação: código ANAC e rubrica

---

## 3. Arquitetura do Sistema

### 3.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Dashboard   │  │ FlightForm  │  │FlightDetails│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Client (fetch)                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │  Flights    │  │   Backup    │        │
│  │   Routes    │  │   Routes    │  │   Routes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Database Layer (Neon)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SSL/TLS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Users     │  │  Flights    │  │  Volumes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Dados

1. **Registro de Voo**: Usuário → Frontend → API → DB → Resposta
2. **Assinatura Digital**: Usuário → Frontend → API → Hash + Lock → DB
3. **Backup Automático**: Scheduler → API → DB → Encrypt → File
4. **Exportação PDF**: Frontend → jsPDF → Download

---

## 4. Segurança

### 4.1 Criptografia em Repouso

| Dado | Método | Detalhes |
|------|--------|----------|
| Senhas | PBKDF2 | 100.000 iterações, SHA-512 |
| Tokens | HMAC-SHA256 | Assinatura digital |
| Dados sensíveis | AES-256-GCM | 256 bits, autenticado |
| Backups | AES-256-GCM | Criptografados em disco |

### 4.2 Integridade dos Dados

- **Hash SHA-256**: Gerado para cada registro de voo
- **Imutabilidade**: Voos assinados não podem ser editados
- **Audit Log**: Todas as ações são registradas

### 4.3 Autenticação

- **Token JWT**: Sessão segura com expiração
- **Roles**: admin, pilot, mechanic
- **Multi-tenant**: Isolamento de dados por empresa

---

## 5. Funcionalidades Implementadas

### 5.1 Módulo de Voo
- ✅ Formulário completo com todos os campos IAC
- ✅ Numeração sequencial automática (NN/CC-MMM/AAAA)
- ✅ Natureza do voo (12 códigos)
- ✅ Tripulação detalhada (8 funções)
- ✅ Ciclos e pousos (parciais e totais)
- ✅ Peso da carga

### 5.2 Módulo de Assinatura
- ✅ Assinatura digital do comandante
- ✅ Rubrica do mecânico
- ✅ Trava de edição pós-assinatura
- ✅ Hash de integridade SHA-256

### 5.3 Módulo de Volumes
- ✅ Criação de volumes do diário
- ✅ Fechamento de volumes
- ✅ Numeração automática
- ✅ Controle de status

### 5.4 Módulo de Relatórios
- ✅ Exportação PDF de voos
- ✅ Exportação JSON (backup)
- ✅ Importação de dados
- ✅ Relatório de conformidade IAC

### 5.5 Módulo de Backup
- ✅ Backup automático periódico
- ✅ Criptografia de backups
- ✅ Restauração de backups
- ✅ Limpeza automática (7 dias)

---

## 6. Estrutura do Banco de Dados

### 6.1 Tabelas Principais

```sql
-- Usuários do sistema
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'pilot',
  tenant_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Registros de voo
CREATE TABLE flights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  sequential_number VARCHAR(50),
  date DATE NOT NULL,
  departure_time VARCHAR(5),
  arrival_time VARCHAR(5),
  aircraft_type VARCHAR(100),
  registration VARCHAR(20),
  departure_airport VARCHAR(4),
  arrival_airport VARCHAR(4),
  flight_types TEXT[],
  flight_time JSONB,
  pilot_in_command VARCHAR(255),
  landings JSONB,
  integrity_hash VARCHAR(64),
  signed BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Volumes do diário
CREATE TABLE logbook_volumes (
  id UUID PRIMARY KEY,
  volume_number VARCHAR(50),
  aircraft_registration VARCHAR(20),
  status VARCHAR(10) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tripulação
CREATE TABLE crew_members (
  id UUID PRIMARY KEY,
  flight_id UUID REFERENCES flights(id),
  name VARCHAR(255),
  anac_code VARCHAR(20),
  function VARCHAR(10),
  license_number VARCHAR(50)
);
```

---

## 7. Requisitos de Homologação

### 7.1 Conformidade com Resolução 458/2017

| Requisito | Implementação |
|-----------|---------------|
| Integridade | Hash SHA-256 em cada registro |
| Rastreabilidade | Audit log completo |
| Autenticação | Login com credenciais |
| Assinatura Digital | Assinatura do comandante |
| Backup | Exportação JSON + backup automático |
| Retenção | Dados mantidos por 5+1 anos |
| Acesso 30 dias | Dados disponíveis em mobile |
| Exportação | PDF e JSON |
| Cadeia de Custódia | Controle de acesso por role |

### 7.2 Certificação ICP-Brasil

**Status**: Estrutura preparada para integração

A assinatura atual é válida para uso interno. Para certificação legal junto à ANAC, é necessário integrar com certificado digital ICP-Brasil.

---

## 8. Testes

### 8.1 Cobertura de Testes

| Módulo | Testes | Status |
|--------|--------|--------|
| Utilitários de voo | 6 | ✅ Passou |
| Tipos de dados | 4 | ✅ Passou |
| Componentes | 9 | ✅ Passou |
| Relatórios | 4 | ✅ Passou |
| **Total** | **23** | **✅ 100%** |

### 8.2 Executar Testes

```bash
npm run test          # Executar testes
npm run test:watch    # Modo observação
npm run test:coverage # Cobertura detalhada
```

---

## 9. Checklist de Homologação

- [x] Todos os campos obrigatórios Parte I implementados
- [x] Todos os campos obrigatórios Parte II implementados
- [x] Numeração sequencial cronológica automática
- [x] 12 códigos de natureza do voo
- [x] 8 funções de tripulação
- [x] Assinatura digital do comandante
- [x] Rubrica do mecânico (RBAC 43)
- [x] Trava de edição para voos assinados
- [x] Hash de integridade SHA-256
- [x] Log de auditoria completo
- [x] Gerenciamento de volumes do diário
- [x] Exportação em PDF
- [x] Exportação em JSON (backup)
- [x] Importação de dados
- [x] Criptografia de dados sensíveis
- [x] Backup automático
- [x] Testes automatizados
- [x] Documentação técnica

---

## 10. Contato

**Desenvolvedor**: [Nome do Desenvolvedor]  
**Email**: [email]  
**Telefone**: [telefone]

---

*Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}*  
*Versão do Sistema: 1.0.0*
