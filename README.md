# Galeria CRM + troca de foto de perfil

## Galeria não abria
Causa: openGaleria chamava ensureShell/openShell (funções privadas do IIFE ops-crm).
Fix: ensureShell/openShell locais em media-galeria via ensureBpSheetModal/openBpSheetModal.

## Foto não substituía
Causa: Storage usa o mesmo path entityId.jpg; URL pública igual → browser/CDN serviam a imagem antiga. Além disso mantinha-se foto_url antiga até ao upload.
Fix:
- Ao escolher nova foto: foto_url = null (UI usa data: local)
- Após upload: foto_url com ?v=timestamp (cache-bust)
- cacheControl Storage 60s
- patchRowAvatar força ?v= se necessário
