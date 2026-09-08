# Manual do Usuário - Diário de Bordo Digital

## Guia Completo de Uso

---

## 1. Introdução

O **Diário de Bordo Digital** é um sistema homologado pela ANAC para registro eletrônico de voos, conforme Resolução nº 773/2025 e Portaria nº 3.220/SPO/SAR/2019.

### 1.1 Requisitos do Sistema

- **Navegador**: Chrome, Firefox, Safari ou Edge (versões recentes)
- **Conexão**: Internet estável
- **Dispositivo**: Computador, tablet ou smartphone

---

## 2. Primeiros Passos

### 2.1 Acessar o Sistema

1. Acesse o endereço do sistema
2. Clique em "Login"
3. Insira seu usuário e senha
4. Clique em "Entrar"

### 2.2 Cadastro de Novo Usuário

1. Na tela de login, clique em "Criar Conta"
2. Preencha:
   - **Nome de Usuário**: mínimo 3 caracteres
   - **Senha**: mínimo 6 caracteres
   - **Nome Completo**
   - **Email** (opcional)
3. Clique em "Cadastrar"

---

## 3. Dashboard

O painel principal exibe:

- **Total de Voos**: Quantidade de voos registrados
- **Horas Totais**: Soma de todas as horas de voo
- **Horas PIC**: Horas como Piloto em Comando
- **Total de Pousos**: Quantidade de pousos realizados
- **Horas por Categoria**: Dia, Noite, Instrumentos, X-Country
- **Voos Recentes**: Lista dos últimos voos

---

## 4. Registrar Novo Voo

### 4.1 Acessar o Formulário

1. Clique em "Registrar Novo Voo" no Dashboard
2. Ou acesse via menu "Voos" → "Novo Voo"

### 4.2 Preencher Dados da Aeronave

- **Fabricante**: Ex: Cessna
- **Modelo**: Ex: 172 Skyhawk
- **Matrícula**: Ex: PT-ABC
- **Número de Série**: Número de série da aeronave
- **Categoria de Registro**: Standard, Restricted, etc.

### 4.3 Preencher Dados do Voo

- **Data**: Data do voo (dd/mm/aaaa)
- **Hora de Decolagem**: Horário UTC (hh:mm)
- **Hora de Pouso**: Horário UTC (hh:mm)
- **Aeroporto de Origem**: Código ICAO (ex: SBGR)
- **Aeroporto de Destino**: Código ICAO (ex: SBGL)

### 4.4 Tempo de Voo

- **Dia**: Horas de voo durante o dia
- **Noite**: Horas de voo durante a noite
- **Instrumentos**: Horas em voo por instrumentos
- **Entre(cidades)**: Horas de voo entre cidades

### 4.5 Pousos

- **Dia**: Quantidade de pousos durante o dia
- **Noite**: Quantidade de pousos durante a noite

### 4.6 Tripulação

Para cada membro da tripulação:
1. Clique em "Adicionar Tripulante"
2. Selecione a função (PIC, SIC, FI, etc.)
3. Insira o nome
4. Insira o código ANAC
5. Insira o número da licença

### 4.7 Natureza do Voo

Selecione o código correspondente:
- **PV**: Primeiro Voo
- **FR**: Voo de Ferry
- **TN**: Treinamento Noturno
- **TR**: Treinamento
- **CQ**: Checagem
- **LR**: Leitura de Rota
- **SA**: Solo (Anotação)
- **EX**: Exibição
- **AE**: Acrobacia Aérea
- **LX**: Local de Exercício
- **LS**: Local de Solo
- **IN**: Instrução

### 4.8 Dados Complementares

- **Ciclos Parciais**: Número de ciclos no voo
- **Ciclos Totais**: Ciclos acumulados da aeronave
- **Peso da Carga**: Peso em kg
- **Passageiros**: Quantidade de passageiros
- **Combustível**: Litros antes da decolagem

### 4.9 Observações

- Campo livre para anotações
- Recomenda-se registrar: condições meteorológicas, ocorrências, etc.

### 4.10 Salvar Voo

1. Revise todos os dados
2. Clique em "Salvar"
3. O voo será registrado com número sequencial automático

---

## 5. Visualizar Voos

### 5.1 Lista de Voos

1. Acesse o menu "Voos"
2. Visualize todos os voos registrados
3. Use os filtros para buscar voos específicos

### 5.2 Detalhes do Voo

1. Clique em um voo na lista
2. Visualize todos os detalhes registrados
3. Opções disponíveis:
   - **Editar**: Alterar dados do voo
   - **Assinar**: Assinar digitalmente o voo
   - **Excluir**: Remover o voo

---

## 6. Assinatura Digital

### 6.1 Por que Assinar?

A assinatura digital:
- Torna o registro **imutável**
- Garante a **autoria** do voo
- Atende à regulamentação ANAC

### 6.2 Como Assinar

1. Abra os detalhes do voo
2. Clique em "Assinar"
3. Confirme a assinatura
4. O voo ficará bloqueado para edição

### 6.3 Voo Assinado

Após assinado:
- Aparência visual de "Assinado"
- Botão de edição desativado
- Hash de integridade registrado

---

## 7. Volumes do Diário

### 7.1 O que são Volumes?

Volumes são "cadernos" do diário de bordo, organizados por:
- Período de tempo
- Aeronave específica

### 7.2 Criar Volume

1. Acesse "Volumes" no menu
2. Clique em "Novo Volume"
3. Preencha:
   - Número do volume (NN/CC-MMM/AAAA)
   - Dados da aeronave
   - Data de abertura
4. Clique em "Criar"

### 7.3 Fechar Volume

1. Na lista de volumes, clique em "Fechar"
2. Confirme o fechamento
3. O volume será marcado como "Fechado"

---

## 8. Exportação de Dados

### 8.1 Exportar PDF

1. Na lista de voos, clique em "Exportar PDF"
2. O arquivo será baixado automaticamente
3. Formato: `diario-de-bordo-YYYY-MM-DD.pdf`

### 8.2 Exportar JSON (Backup)

1. Clique em "Exportar JSON"
2. O arquivo será baixado
3. Formato: `diario-de-bordo-YYYY-MM-DD.json`

### 8.3 Importar Dados

1. Clique em "Importar"
2. Selecione o arquivo JSON
3. Os dados serão restaurados

---

## 9. Relatório de Conformidade

### 9.1 Acessar

1. No Dashboard, clique em "Relatório IAC"
2. O PDF será gerado automaticamente

### 9.2 Conteúdo

O relatório inclui:
- Regulamentação aplicável
- Campos obrigatórios implementados
- Funcionalidades do sistema
- Checklist de conformidade
- Declaração de conformidade

---

## 10. Perfil do Piloto

### 10.1 Acessar

1. Clique no ícone do perfil
2. Selecione "Meu Perfil"

### 10.2 Dados Cadastrais

- Nome completo
- Tipo de licença
- Número da licença
- Classe do certificado médico
- Validade do certificado médico
- CPF
- Total de horas de voo

### 10.3 Editar

1. Clique em "Editar"
2. Altere os dados necessários
3. Clique em "Salvar"

---

## 11. Configurações

### 11.1 Tema

- **Claro**: Para uso durante o dia
- **Escuro**: Para uso noturno (recomendado em voo)

### 11.2 Notificações

- Alertas de validade de certificado médico
- Lembretes de backup

---

## 12. Dicas de Uso

### 12.1 Melhores Práticas

1. **Registre imediatamente após o voo**
2. **Seja detalhado nas observações**
3. **Assine os voos regularmente**
4. **Faça backup periodicamente**
5. **Verifique os dados antes de assinar**

### 12.2 Uso em Voo

- O sistema é **responsivo** e funciona em celulares
- Use o **modo escuro** para preservar a visão noturna
- Dados ficam disponíveis por **30 dias** sem internet

### 12.3 Conformidade

- Todos os campos obrigatórios estão marcados
- O sistema gera numeração automática
- A assinatura garante imutabilidade
- O hash de integridade verifica autenticidade

---

## 13. Suporte

### 13.1 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Não consigo fazer login | Verifique usuário e senha |
| Dados não salvam | Verifique a conexão |
| PDF não gera | Aguarde o processamento |
| App lento | Limpe o cache do navegador |

### 13.2 Contato

- **Email**: suporte@diariodebordo.com.br
- **Telefone**: (XX) XXXX-XXXX
- **Horário**: Segunda a Sexta, 8h às 18h

---

## 14. Glossário

| Termo | Significado |
|-------|-------------|
| **PIC** | Piloto em Comando (Pilot in Command) |
| **SIC** | Segundo em Comando |
| **FI** | Instrutor de Voo |
| **ICAO** | Organização da Aviação Civil Internacional |
| **UTC** | Tempo Universal Coordenado |
| **RAB** | Registro Aeronáutico Brasileiro |
| **ANAC** | Agência Nacional de Aviação Civil |
| **RBAC** | Regulamento Brasileiro de Aviação Civil |

---

*Manual versão 1.0.0 - Setembro 2026*
