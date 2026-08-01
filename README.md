# Contingência delete / soft-delete (BeautyPro)

## Comportamento
- **Profissionais**: permanecem no salão com `ativo=false` (histórico). PATCH directo ao Supabase + verificação GET. Se falhar → fila + flush + retry ao voltar online.
- **Serviços**: tentativa de DELETE real; se FK/RLS impedir → `ativo=false` no servidor.
- **Merge**: se local ou remoto estiver inactivo, o resultado fica sempre inactivo e força sync se o remoto ainda estiver activo.
- **Anónimo / outro device**: lê o servidor; se `ativo=false` no Supabase, a lista activa não mostra o profissional.

## Deploy
1. Substituir `app.bundle.js` (e módulos se debug).
2. Correr `SUPABASE_DELETE_ATIVO.sql` no SQL Editor.
3. Limpar cache SW / reabrir app.
4. Destituir de novo um profissional de teste e confirmar no SQL:
   `SELECT id,nome,ativo FROM profissionais WHERE salao_id='...';`

## Já destituídos que ainda aparecem no anónimo
No SQL:
```sql
UPDATE profissionais SET ativo=false, data_desativacao=now(), updated_at=now()
WHERE salao_id='SEU_UUID' AND nome IN ('Nome1','Nome2');
```
