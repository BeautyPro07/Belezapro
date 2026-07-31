## Supabase — checklist (só o que é do vosso lado)

1. Tabela clientes: coluna foto_url (text)
2. Tabela profissionais: coluna foto_url (text)
3. Storage → bucket «fotos» (público para leitura)
4. Policies no bucket:
   - SELECT público (ou autenticado, desde que a app consiga ler a URL)
   - INSERT/UPDATE/DELETE: authenticated + path com salao_id do profile
5. Confirmar: Storage → fotos → upload manual de um jpg de teste
6. Se upload na app der «permissões / RLS»: rever policy INSERT (foldername = salao_id)
7. Não é preciso reexecutar SQL se 1–4 já estão OK
