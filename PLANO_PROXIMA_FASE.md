# PLANO RECOMENDADO — PRÓXIMA FASE (Fase E)

## Objectivo
Levar o BeautyPro de **7.1 → 8.5+** e preparar para crescimento real (dezenas/centenas de salões).

## Ordem recomendada

### Sprint 1 (1-2 semanas) — Segurança e fundações
1. Implementar RLS completo (seguir `GUIA_DE_IMPLEMENTAÇÃO.md`)
2. Auditar Edge Function da IA
3. Adicionar índices SQL sugeridos
4. Testes manuais de isolamento multi-salão

### Sprint 2 — Migração do Store
1. Migrar todos os `state.xxx.push` / atribuições directas nos ficheiros de eventos e UI para os helpers do Store
2. Introduzir `subscribe` nos renders principais (dashboard, agenda, clientes) para re-render mais preciso
3. Remover gradualmente a dependência de `updateUI()` global

### Sprint 3 — Qualidade e performance
1. Introduzir Vite (ou esbuild) + ES Modules
2. Virtualizar listas longas (clientes / movimentos)
3. Testes E2E com Playwright (login, CRUD, offline, troca de salão)
4. Melhorar resolução de conflitos no merge remoto

### Sprint 4 — Produto e escala
1. Contador de recibos único por salão (remoto)
2. Auditoria de alterações (quem alterou o quê)
3. Webhooks / notificações
4. Dashboard de administração multi-salão (se aplicável)

## Métricas de sucesso
- Zero regressões funcionais
- Tempo de carregamento inicial < 1.5s em 3G
- Delete + sync < 800ms em condições normais
- Cobertura de testes críticos > 60%
- RLS a bloquear 100% dos acessos cross-salão
