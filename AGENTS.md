# Instruções para Assistentes de IA

## ⚠️ PRIORIDADE MÁXIMA

### 🚫 NUNCA fazer `git push` sem solicitação explícita do usuário

1. **NÃO execute `git push`** a menos que o usuário solicite diretamente
2. **NÃO execute `git commit`** sem o consentimento do usuário
3. **NÃO execute `npx vercel --prod`** - o deploy é automático via git push
4. **SEMPRE pergunte** antes de enviar alterações para o repositório remoto

### ✅ Fluxo correto
```
1. Usuário solicita mudança
2. IA implementa a mudança
3. IA testa localmente
4. IA PERGUNTA se deve commitar/push
5. Usuário autoriza
6. IA faz commit + push
```

---

## 📱 REGRAS DE LAYOUT MOBILE

### EMPILHAR para evitar scroll

1. **SEMPRE** usar `grid-cols-1` como padrão mobile
2. Nunca mais de 2 colunas sem prefixo `lg:`
3. Dados: empilhar verticalmente
4. Formulários: campos full-width
5. Gap: usar `gap-3` em vez de `gap-4`

### Padrão de grid correto
```tsx
// ✅ CORRETO
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

// ❌ ERRADO - força scroll
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

### Regra de ouro
> Se precisa de scroll horizontal em mobile, empilhar verticalmente.

---

## ✈️ REGULAMENTAÇÃO IAC/ANAC - DIÁRIO DE BORDO DIGITAL

### Regulamentos Aplicáveis
- **Resolução ANAC nº 773/2025** - Diário de Bordo das aeronaves civis brasileiras (vigente desde 01/01/2026)
- **Portaria nº 2.050/SPO/SAR/2018** - Modelo de referência físico
- **Portaria nº 3.220/SPO/SAR/2019** - Modelo de referência eletrônico (eDB)
- **Portaria nº 14.096/SPO/2024** - Funções a bordo
- **Resolução nº 458/2017** - Sistemas informatizados
- **RBAC nº 91, Seção 91.417** - Manutenção de registros

### Campos Obrigatórios por Regulamento

#### Parte I - Registros de Voo
1. Número sequencial cronológico
2. Número da página do diário
3. Identificação da aeronave (marcas PT-XXX)
4. Fabricante, modelo e número de série
5. Categoria de registro
6. Tripulação: nome, código ANAC e função
7. Data do voo (dd/mm/aa)
8. Aeródromos de origem e destino (ICAO)
9. Horários: decolagem e pouso (UTC/Zulu)
10. Tempo de voo: dia, noite, IFR-R, IFR-C, total
11. Ciclos parciais e totais
12. Pousos parciais e totais
13. Combustível total antes da decolagem
14. Natureza do voo (PV, FR, TN, TR, CQ, LR, SA, EX, AE, LX, LS, IN)
15. Passageiros por etapa
16. Carga transportada
17. Assinatura do comandante
18. Rubrica do mecânico (RBAC 43)
19. Ocorrências

#### Parte II - Situação Técnica
1. Última intervenção de manutenção
2. Próxima intervenção de manutenção
3. Horas para próxima intervenção
4. Data, ATA, discrepância, ação corretiva
5. Liberação: código ANAC e rubrica

### Funções a Bordo (Portaria 14.096/SPO/2024)
- PIC, SIC, FI, FE, N1, N2, OBS, REL

### Requisitos para Meio Digital
- Integridade, rastreabilidade, autenticação
- Assinatura digital (não-repúdio)
- Backup e redundância
- Retenção: 5 anos + 1 dia após cancelamento RAB
- 30 dias acessíveis a bordo
- Exportação PDF/CSV

### Segurança Implementada
- Senhas: PBKDF2 (100k iterações, SHA-512)
- Dados sensíveis: AES-256-GCM
- Backups: Criptografia AES-256-GCM em disco
- Tokens: HMAC-SHA256 com expiração
- Hash de integridade: SHA-256

### Testes Automatizados
- 23 testes passando (Vitest)
- Cobertura: utils, componentes, tipos, relatórios
- Executar: `npm run test`

### Backup Automático
- Criptografado em disco
- Limpeza automática (7 dias)
- API REST: `/api/backup/*`

### Pendência
- Integração ICP-Brasil (estrutura preparada)

### Numeração do Diário
- Formato: NN/CC-MMM/AAAA
- Ex: 001/PTABC/2026

---

*Atualizado: 08/09/2026*