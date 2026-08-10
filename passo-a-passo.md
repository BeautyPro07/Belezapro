# Passo a passo — BeautyPro (pós etapas de regras + UI)

## A. Instalar o frontend (este ZIP)

1. Extrair o ZIP sobre a pasta da app (substituir ficheiros listados).
2. Hard refresh no dispositivo (ou limpar cache do Service Worker).
3. Confirmar no console que o SW é `belezapro-shell-v20260810-final` (ou superior).

## B. Testar correcções de UI (obrigatório)

### Visualização vs formulário
1. Abrir um **cliente existente** (toque na linha) → deve ver **só** a ficha (WhatsApp/Ligar, dados). **Não** devem aparecer campos de edição por baixo.
2. Tocar **Editar** → só o formulário, com dados desse cliente.
3. Fechar → **Novo cliente** → formulário **vazio** (sem nome/telefone de outro).
4. Repetir o mesmo fluxo em **Equipa** e **Serviços**.

### Validação com «Entendi»
1. Novo profissional → Guardar sem idade → modal «Quase lá» com mensagem orientadora → **Entendi** → o cursor vai para **Idade**.
2. Novo cliente → telefone vazio ou `823…` → mesma lógica → foco em **Celular**.
3. Novo serviço → sem profissionais → mensagem → Entendi.
4. Registar venda incompleta → modal → Entendi → foco no campo em falta.

## C. Supabase (SQL Editor)

1. Backup do projecto (Dashboard → Database).
2. Abrir o ficheiro `SUPABASE_R50_E_CLIENTES.sql` deste pacote.
3. Colar e **Run** no SQL Editor.
4. Confirmar o SELECT final devolve as colunas novas.
5. (Opcional) Reaplicar `SUPABASE_HARDENING.sql` se o RLS ainda não estiver activo no projecto real.

## D. O que o SQL + sync resolvem

| Coluna / campo | Uso |
|----------------|-----|
| `clientes.ativo` | Isolar clientes inactivos (R48) |
| `movimentos.status` | `activo` / `cancelado` |
| `comissao_estornada`, `cancelado_em`, `cancelado_motivo` | Estorno (R50) |
| Sync em `sync-rest.js` | Envia estes campos no upsert de movimentos |

## E. Ainda opcional (não bloqueia o uso diário)

- UI completa de «Cancelar venda» no detalhe (função `cancelarVenda` já existe).
- CHECK SQL rígido `profissional_id` em vendas (só após limpar legados).
- Produtos (R07) e descontos (R16) — fora de âmbito por decisão.

## F. Se algo falhar

- Mensagem de validação não aparece: confirme que `modal-erro` existe no `index.html` e que o bundle foi regenerado.
- Ficha + formulário juntos: confirme `login-carrinho-venda.css` com regra `[hidden] { display: none !important }`.
- Sync 400 em colunas novas: execute o SQL da secção C antes de cancelar vendas online.
