# Missão a fazer — BeautyPro (Etapa 4.6 e fecho operacional)

Este documento é o **mapa de acção** para ti (humano): o que o código já faz, o que tens de executar no Supabase, e como validar.  
Não é reconstrução — é **activar** o que o cliente já espera.

---

## 0. Objectivo

1. Recibos com sequência multi-dispositivo  
2. Contador de perguntas IA multi-dispositivo  
3. Fotos offline → upload quando houver internet  
4. Filas grandes (600+ ops) estáveis, sem perda e sem “tudo ou nada”  
5. Schema + RLS + Storage no Supabase alinhados com o app  

---

## 1. O que já está no código do app (cliente)

| Área | Comportamento actual |
|------|----------------------|
| **Fila sync** | Sem teto; flush em **lotes de 25**; grava progresso entre lotes; backoff; DUPLICADO não retenta em loop |
| **Recibos** | `reciboNum` em cada venda (movimentos); contador local por salão; tenta ler/escrever `salao_config.recibo_counter`; reconcilia max com movimentos |
| **IA** | Limites por plano (Pro 5/dia, Premium ilimitado); contador local por salão+dia; push/pull `ia_uso_diario` + espelho `salao_config` |
| **Fotos** | Compressão local; `foto` data: no device; fila `bp_foto_upload_queue`; upload Storage; grava `foto_url`; flush no `online` / visibility / silent pull |
| **Serviço↔Prof** | Serviço exige ≥1 profissional; profissional exige especialidade; sem “toda a equipa” |
| **RBAC** | Guards operacionais em acções sensíveis |

Ficheiros-chave: `sync-queue.js`, `core-utils.js`, `ia-module.js`, `media-galeria.js`, `crud-operations.js`, `auth-supabase.js`, `sync-rest.js`.

---

## 2. Passo a passo no Supabase (obrigatório)

### Passo A — SQL

1. Abre o projecto no [Supabase Dashboard](https://supabase.com/dashboard)  
2. **SQL Editor** → New query  
3. Cola e executa o ficheiro **`SUPABASE_ETAPA4_6_COMPLETO.sql`** (incluído neste ZIP)  
4. Confirma: Success / sem erros de policy duplicada graves  

O script cria/altera:

- `salao_config.recibo_counter`, `ia_perguntas_hoje`, `ia_perguntas_dia`  
- tabela `ia_uso_diario` + RLS  
- `movimentos.recibo_num`  
- `clientes.foto_url`, `profissionais.foto_url`  
- `galeria_fotos` + RLS  
- bucket Storage `fotos` + policies  
- RLS em `salao_config`  

### Passo B — Storage

1. **Storage** → verifica bucket **`fotos`** (público leitura, 2 MB, jpeg/png/webp)  
2. Se o INSERT do SQL falhou por permissões, cria o bucket manualmente com os mesmos limites  

### Passo C — Mapear colunas REST (movimentos)

O cliente envia campos em camelCase/snake conforme `toSupabaseFormat`. Confirma no Table Editor que `movimentos` aceita o campo de recibo:

- Preferível: coluna `recibo_num` (texto)  
- Se a app enviar `reciboNum` no JSON, o mapeamento em `sync-rest.js` deve incluir esse campo — se após o SQL as vendas sincronizarem sem recibo, verifica `toSupabaseFormat` case `movimentos` e adiciona `recibo_num: item.reciboNum`.

### Passo D — Edge Function IA (recomendado)

1. **Edge Functions** → `ia-query`  
2. Garantir que valida JWT (não só ANON) e, se possível, rate-limit por `salao_id`  
3. Redeploy após alterações de secrets  

### Passo E — Deploy do frontend

1. Substitui os ficheiros do ZIP da Etapa 4.6 no hosting  
2. Hard refresh / limpar SW antigo (`belezapro-shell-v20260809-et4p6`)  
3. Login online uma vez para puxar config + contadores  

---

## 3. Regras de negócio a respeitar (não contornar)

1. **Serviço** sem profissional associado → inválido  
2. **Profissional** sem serviço (especialidade) → inválido  
3. Lista vazia de profissionais **não** significa “toda a equipa”  
4. **Fila de sync** nunca deve ser truncada por política de “máximo N”  
5. **Fotos**: manter data URL local até `foto_url` remoto existir  
6. **IA**: trial/starter sem cota online; Pro 5/dia; Premium ilimitado (cliente); servidor deve reforçar  
7. **Isolamento**: tudo filtrado por `salao_id` / profile  

---

## 4. Testes manuais (checklist)

### 4.1 Fila 600+ (simulação)

1. Modo avião  
2. Criar dezenas de clientes/agendamentos/vendas (ou repetir acções)  
3. Voltar online  
4. Observar indicador de sync a descer **progressivamente** (não travar a UI)  
5. Confirmar dados no Supabase Table Editor  

### 4.2 Recibos

1. Dois dispositivos, mesmo salão  
2. Venda em A → anotar recibo  
3. Sync + venda em B → número **não** deve regredir; sequência sobe com max global  

### 4.3 IA

1. Plano Pro: 5 perguntas → 6.ª bloqueada  
2. Segundo dispositivo no mesmo dia: contador deve **aproximar-se** após sync (max local/remoto)  
3. Offline: respostas locais quando aplicável  

### 4.4 Fotos

1. Offline: associar foto a cliente  
2. Confirmar preview local  
3. Online: após 1–2 s / reabrir app, `foto_url` preenchido e Storage com ficheiro em `{salao_id}/...`  

### 4.5 RBAC + serviço/prof

1. Operador não fecha caixa / não edita equipa  
2. Criar serviço sem marcar profissional → erro  
3. Criar profissional sem especialidade → erro  

---

## 5. Códigos SQL (referência rápida)

O ficheiro completo está em **`SUPABASE_ETAPA4_6_COMPLETO.sql`**.

Trechos críticos:

```sql
ALTER TABLE public.salao_config
  ADD COLUMN IF NOT EXISTS recibo_counter integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ia_perguntas_hoje integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ia_perguntas_dia date;

CREATE TABLE IF NOT EXISTS public.ia_uso_diario (
  salao_id uuid NOT NULL,
  dia date NOT NULL,
  perguntas integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (salao_id, dia)
);
```

Policies: isolamento por `profiles.salao_id = auth.uid()` (ver script).

---

## 6. Mapeamento recibo no cliente (se necessário)

Se após o SQL o recibo não aparecer na tabela `movimentos`, em `sync-rest.js` na função `toSupabaseFormat` case `'movimentos'`, garantir algo equivalente a:

```js
recibo_num: item.reciboNum || item.recibo_num || null,
```

e no `fromSupabaseFormat`:

```js
reciboNum: row.recibo_num || row.reciboNum || null,
```

(Não aplicar à cegas se já existir mapeamento correcto.)

---

## 7. Ordem de prioridade se algo falhar

| Sintoma | Acção |
|---------|--------|
| Fila não desce | Network tab: 401/403 → JWT/RLS; 409 → duplicados |
| Recibo sempre 0001 | SQL `recibo_counter` + sync login; ver localStorage `bp_recibo_counter_*` |
| IA sempre 0 remoto | Tabela `ia_uso_diario` + policies |
| Foto só local | Bucket `fotos` + policy path `{salao_id}/...` + `bpFlushFotoUploadQueue` |
| UI lenta no sync | Normal em 600+; lotes de 25 — esperar; não matar o separador |

---

## 8. Entregáveis neste ZIP

- Código cliente actualizado (bundle + fontes)  
- `SUPABASE_ETAPA4_6_COMPLETO.sql`  
- Este ficheiro: **`missão a fazer.md`**  
- `README.md` com vestígios ET4.6  

---

## 9. O que fica conscientemente para depois

- Pagamentos reais de plano  
- Edge IA com quota server-side obrigatória (recomendado mas config no dashboard)  
- Painel admin de “ops falhadas” sofisticado  
- Migração Vite/ESM  

---

**Quando completares os Passos A–E e o checklist 4.x, a missão 4.6 está cumprida.**
