# Profissionais: dados + criar serviço no modal

## Sync de dados
toSupabaseFormat / fromSupabaseFormat passam a incluir:
idade, data_contratual, numero_bi, morada, contacto, taxa_comissao, meta_mensal, especialidade, ativo, foto_url

## Modal profissional
- Select só lista serviços **activos** (eliminados/inactivos não aparecem)
- Opção «+ Criar novo serviço» mostra caixa branca no modal
- Botão «Criar serviço» grava na aba Serviços + toast de ajuste
- Guardar com «Criar novo» sem preencher a caixa tenta criar no fluxo de save

## Supabase
Correr SUPABASE_PROF_CAMPOS.sql uma vez (colunas novas).
