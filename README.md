# Pacote: galeria sync + foto no create + agenda dia exacto

## 1. Galeria CRM multi-dispositivo
- Tabela galeria_fotos (SUPABASE_GALERIA.sql) — OBRIGATÓRIO
- Upload → Storage + upsert metadados
- Abrir galeria → pull + merge
- Contingência list Storage

## 2. Foto ao criar perfil
- Antes: pending só com setTimeout frágil → lista só com inicial
- Agora: após addProfissional/addCliente aplica takePending*Foto + set*Foto + re-render lista

## 3. Agenda «Dia exacto»
- Input deixou de estar pointer-events:none invisível
- showPicker() + input visível no popover
- Listeners só em #agenda-filter-popover

## Deploy
1. SUPABASE_GALERIA.sql
2. app.bundle.js + index.html
3. Hard refresh PWA
