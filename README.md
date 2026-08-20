# 🛩️ Diário de Bordo Digital - ANAC

Sistema digital para registro de voos em conformidade com as normas da **Agência Nacional de Aviação Civil (ANAC)** do Brasil, seguindo os padrões da **ICAO (Organização da Aviação Civil Internacional)**.

## 📋 Sobre o Projeto

Este projeto implementa um diário de bordo digital completo para pilotos brasileiros, com interface responsiva para dispositivos móveis e desktop.

### Características Principais

- ✅ **Conformidade ANAC**: Segue os campos obrigatórios do ICAO Doc 9868 e Resolução ANAC nº 478
- 📱 **Mobile-First**: Design responsivo para uso em smartphones e tablets
- 💾 **Banco de Dados**: Neon PostgreSQL para armazenamento na nuvem
- 📊 **Estatísticas**: Cálculos automáticos de horas de voo por categoria
- 🔄 **Sincronização**: Exportação e importação de dados em formato JSON
- 🔒 **Privacidade**: Dados armazenados de forma segura na nuvem

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Vite** como bundler
- **React Router** para navegação
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **TypeScript**
- **Neon PostgreSQL** (via @neondatabase/serverless)
- **CORS** para comunicação frontend-backend

## 📁 Estrutura do Projeto

```
diario-de-bordo/
├── src/                          # Frontend React
│   ├── api/                      # Serviços de API
│   │   └── flights.ts
│   ├── components/               # Componentes React
│   │   ├── Layout.tsx
│   │   ├── FlightForm.tsx
│   │   ├── FlightList.tsx
│   │   └── FlightCard.tsx
│   ├── pages/                    # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── NewFlight.tsx
│   │   ├── FlightList.tsx
│   │   └── FlightDetails.tsx
│   ├── types/                    # Definições TypeScript
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/                       # Backend Express
│   ├── src/
│   │   ├── lib/
│   │   │   └── db.ts            # Conexão Neon PostgreSQL
│   │   ├── routes/
│   │   │   └── flights.ts
│   │   ├── database.ts          # Schema e repositórios
│   │   └── index.ts
│   ├── .env                      # Variáveis de ambiente
│   └── package.json
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Neon PostgreSQL (https://neon.tech)

### Instalação

```bash
# 1. Clone ou baixe o projeto
cd diario-de-bordo

# 2. Instale as dependências do frontend
npm install

# 3. Instale as dependências do backend
cd server
npm install
cd ..
```

### Configurar Neon PostgreSQL

1. Acesse o console do Neon: https://console.neon.tech
2. Crie um projeto (ou use um existente)
3. Vá em **Project Settings** → **Connection Details**
4. Copie a string de conexão
5. Edite o arquivo `server/.env`:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
PORT=3001
```

### Executar o Projeto

```bash
# Terminal 1: Iniciar o backend (porta 3001)
cd server
npm run dev

# Terminal 2: Iniciar o frontend (porta 3000)
npm run dev
```

Acesse: `http://localhost:3000`

## 📊 Campos do Diário de Bordo (ANAC/ICAO)

O sistema registra todos os campos obrigatórios conforme regulamentação:

### Dados Básicos
| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Data | Data do voo (DD/MM/AAAA) | ✅ |
| Hora de Decolagem | Horário UTC | ✅ |
| Hora de Pouso | Horário UTC | ✅ |

### Aeronave
| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Tipo | Modelo da aeronave | ✅ |
| Matrícula | Registro ANAC (PT-XXX) | ✅ |

### Aeródromos
| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Origem | Código ICAO (ex: SBGR) | ✅ |
| Destino | Código ICAO (ex: SBGL) | ✅ |

### Tipos de Voo
- **Duplo Comando (Dual)**: Voo instruído
- **Solo**: Voo sem instrutor
- **PIC**: Piloto em Comando
- **SIC**: Segundo em Comando
- **Entre(cidades)**: Cross Country
- **Instrução**: Aula de voo
- **Checagem**: Check ride
- **IPC**: Instrument Proficiency Check
- **BFR**: Biennial Flight Review

### Tempo de Voo (Horas)
- Dia
- Noite
- Instrumentos
- Entre(cidades)

### Pousos
- Dia
- Noite

### Tripulação
- Piloto em Comando (PIC)
- Segundo em Comando (SIC)
- Instrutor (se aplicável)

### Observações
- Campo livre para anotações

## 📱 Interface Mobile

O sistema foi projetado com foco em dispositivos móveis:

- Botões grandes para fácil toque
- Layout responsivo que se adapta ao tamanho da tela
- Navegação simplificada
- Formulários otimizados para teclado virtual
- Área segura para notches e gestures

## 💾 Exportação e Importação

### Exportar Dados
Clique em "Exportar JSON" para baixar todos os seus voos em formato JSON. O arquivo pode ser:
- Usado como backup
- Importado em outro dispositivo
- Analisado em planilhas

### Importar Dados
Use a função de importação para restaurar dados de um backup JSON.

## 🔒 Segurança e Privacidade

- Dados armazenados de forma segura no Neon PostgreSQL
- Conexão criptografada via SSL
- Variáveis de ambiente para credenciais
- Faça backups regulares dos seus dados

## ⚠️ Aviso Importante

Este aplicativo é uma **ferramenta auxiliar** para organização e cálculo de horas de voo. O registro oficial de voo deve seguir o **diário de bordo homologado pela ANAC**.

Conforme a regulamentação:
- O diário de bordo físico é obrigatório para voos de instrução
- Este sistema pode servir como cópia de segurança e organização
- Mantenha sempre o diário físico atualizado conforme exigido pela ANAC

## 📚 Referências

- [ICAO Doc 9868 - Pilot Training Manual](https://www.icao.int/)
- [Resolução ANAC nº 478 - Exigências de Aeronavegabilidade](https://www.gov.br/anac/)
- [Código Brasileiro de Aeronáutica](https://www.planalto.gov.br/)
- [Neon PostgreSQL Docs](https://neon.tech/docs)

## 🤝 Contribuindo

Este é um projeto open-source. Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commit das suas mudanças
4. Abra um Pull Request

## 📄 Licença

MIT License - Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a comunidade de aviação brasileira**

✈️ Voar é permitir que o céu seja o limite! ✈️
