# CHANGELOG — Fase E (Correções críticas + melhorias de usabilidade)

## Bugs críticos corrigidos
1. **Registo de venda falhava** com mensagem genérica → harden de `registarVenda` + handler (não falha por rede; validações claras; itens normalizados)
2. **Próximos atendimentos / contador "X pendentes"** ficava desatualizado → conta só `status === 'agendado'` com data/hora futura; chama `atualizarAgendamentosExpirados` antes
3. **Sparkline + %** estáticos / genéricos → eliminados e reimplementados ligados ao filtro do dashboard; % com 1 casa decimal vs período anterior equivalente
4. **Fundo padrão 50000** → agora **0**
5. **Filtro Agenda "Cancelados"** → "Não realizados" (sem emoji); inclui `nao_realizado` + `cancelado`
6. **Emojis** removidos de labels de filtro e saudação do dashboard
7. **Clique no cliente** abre perfil em modo só leitura (visualização)

## Melhorias
- Store (Fase D) mantido
- Deletes optimistas (Fase D) mantidos
- Validadores de telefone (9 dígitos) e BI preparados
- Badge da agenda continua a contar todos os futuros disponíveis

## Pendente (requer HTML/CSS adicional ou teu input) — ver GUIA
- Filtro completo na aba Caixa + pesquisa de cliente com período
- Campos Equipa: data contratual, especialidade a partir de serviços, "Criar serviço"
- Obrigatoriedade de profissional ao criar serviço
- Redesign fino de botões "Realizar" / recibo / modais de venda
- RLS Supabase (igual Fase D)
