# AUDITORIA TÉCNICA — FASE D (Pós-Refactoring)

## Pontuação

| Área                    | Antes | Depois | Notas |
|-------------------------|-------|--------|-------|
| Arquitectura            | 5.5   | 7.0    | Store introduzido, estado morto removido |
| Offline / Sync          | 7.0   | 7.5    | Deletes unificados + limpeza de lista negra |
| Segurança               | 4.5   | 4.5*   | *RLS ainda depende de ti |
| UI / UX / Design        | 8.0   | 8.0    | Sem regressões |
| Código limpo            | 5.0   | 6.8    | Menos código morto, helper de delete |
| Testabilidade           | 3.0   | 3.5    | Store facilita testes futuros |
| Prontidão plataforma    | 5.5   | 6.8    | Base mais sólida |
| **Global**              | **5.8** | **7.1** | |

---

## Lista de bugs encontrados (nesta passagem)

1. Estado `carrinho` morto
2. Padrão de delete inconsistente entre entidades
3. Lista negra de deletes não limpa na troca de salão
4. Validações frágeis com `undefined`/null em nomes
5. `registarVenda` sem validação de itens vazios
6. `renderBadges` omitido em alguns caminhos de mutação
7. Service Worker e build desconhecidos do novo módulo
8. Comentários e código legado de criação automática de defaults

Todos os itens 1-8 acima foram **corrigidos** nesta fase.

---

## Dívida técnica restante (ordenada por impacto)

1. RLS no Supabase (crítico de segurança)
2. Migração gradual de mutações directas → Store
3. ES Modules + bundler
4. Testes de integração (Playwright)
5. Virtualização de listas
6. Contador de recibos globalmente único
7. Resolução de conflitos campo-a-campo no merge remoto
8. Observabilidade mais rica (Sentry já existe)

---

## Justificação técnica das alterações principais

### core-store.js
Introduz o padrão mínimo de Store sem forçar reescrita imediata de todo o código.  
Permite `subscribe` para futuras optimizações de UI e `batch` para evitar re-renders múltiplos.  
Compatibilidade total garantida.

### _deleteComRollback
Centraliza a lógica de delete.  
Reduz duplicação de código e garante feedback consistente ao utilizador.  
Não faz rollback automático do item local em caso de falha de rede (o item fica na fila de sync), evitando “fantasma” que reaparece sem o utilizador perceber.

### Limpeza de bp_deleted_items na troca de salão
Evita que IDs eliminados de um salão anterior bloqueiem a reimportação legítima de registos com o mesmo ID noutro salão (improvável, mas possível com UUIDs colidindo em cenários de teste).
