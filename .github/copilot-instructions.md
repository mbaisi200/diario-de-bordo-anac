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

*Adicionado: 20/08/2026*
