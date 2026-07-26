# CHANGELOG — Quality Gate Internacional (Implementação)

## Implementado

### Identidade visual oficial
- Graphite Navy `#1F2937` → texto principal, logo, autoridade
- Commercial Amber `#B7791F` → ações primárias, destaques, nav activa
- Warm Ivory `#F8F7F4` → fundo global

### Sistema de botões
- Primary / Secondary / Ghost / Danger
- Altura 48px (sm 36px)
- Border-radius 8px
- Estados: hover, active, focus-visible, disabled, loading
- Removidas variantes excessivas (xs/lg/xl colapsadas)

### Inputs
- Altura 48px uniforme
- Borda, raio 8px, focus amber
- Labels uppercase consistentes
- Estado error padronizado

### Espaçamento
- Tokens `--s1`…`--s6` (8–48px)
- Cards, modais, tab-inner, list-items alinhados ao ritmo 8px

### Tipografia
- Escala: xs 11 · sm 12 · md 14 · base 15 · lg 17 · xl 20 · 2xl 24
- Modal titles e section titles em sans (Inter)
- KPIs com tabular-nums

### Ícones / feedback
- Emojis residuais removidos de index, renders e detalhes
- Avatares de movimento/serviço → indicadores circulares neutros
- Nav SVG com stroke consistente

### Estados
- Skeleton shimmer
- Empty state padronizado
- Toast navy / success / error / warning
- Focus-visible amber global

### Ficheiro novo
- `design-system-final.css` (carregado após tokens)

### SW
- `beautypro-shell-v14`
