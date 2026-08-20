#!/bin/bash
# ==========================================
#  Diário de Bordo Digital - Iniciar Tudo
# ==========================================

echo "✈️  Diário de Bordo Digital - ANAC"
echo "=================================="
echo ""

# Matar processos anteriores nas portas 3000 e 3001
echo "🔄 Limpando portas anteriores..."
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:3001) 2>/dev/null
sleep 1

# Iniciar Backend
echo "🚀 Iniciando Backend (porta 3001)..."
cd "$(dirname "$0")/server" && npm run dev &
BACKEND_PID=$!
sleep 4

# Verificar se backend subiu
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "✅ Backend rodando em http://localhost:3001"
else
  echo "❌ Erro ao iniciar backend"
fi

# Iniciar Frontend
echo "🚀 Iniciando Frontend (porta 3000)..."
cd "$(dirname "$0")" && npm run dev &
FRONTEND_PID=$!
sleep 4

echo ""
echo "=================================="
echo "✅ Tudo rodando!"
echo ""
echo "📱 Acesse: http://localhost:3000"
echo ""
echo "🔐 Login:"
echo "   Usuário: neto"
echo "   Senha:   123456"
echo ""
echo "⚠️  Pressione Ctrl+C para parar todos os servidores"
echo "=================================="

# Esperar e manter rodando
wait
