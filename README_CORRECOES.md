# Correcções BeautyPro (2026-08-01)

1. sw.js — cache só app.bundle.js + CSS do HTML (sem módulos legados)
2. main.js — pull 45s, sem updateUI se modal aberto ou dados iguais
3. sync-rest.js — delete retorna true; merge não reintroduz órfãos; reforça DELETE se tombstone; fingerprint anti-vibração
4. crud — soft-delete profissional faz flushSyncQueue imediato
5. role — bp_user_role em localStorage (evita flash 4 abas operador)
6. modal venda — overflow scroll + openVendaModal robusto
7. CRM galeria — acordeão despacha acções; BPOps exports; item Galeria
8. SUPABASE_HARDENING.sql — RLS + indexes + ativo + fotos
