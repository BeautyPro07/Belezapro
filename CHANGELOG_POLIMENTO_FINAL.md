# CHANGELOG — Fase Final de Polimento (Constituição de Design V1.0)

Director de Produto — aprovação pré-lançamento.

## Alterações (todas justificadas por princípios)

### Tipografia
- Títulos de modal e confirmação passam a **sans** (Inter), não serif isolado.
  Justificação: hierarquia por peso/tamanho, não por mudança de família (HIG / Linear / Stripe).
- Serif mantido apenas onde é padrão de sistema consistente (logo, títulos de secção de aba).

### Texto
- `text-align: justify` eliminado em modais e mensagens.
  Justificação: legibilidade em UI (NN/g); justificado só em documentos.

### Pseudo-ícones
- Letras "V"/"D" em movimentos substituídas por indicador circular colorido.
  Justificação: proibição de letras isoladas como ícones; avatar/badge neutro.

### Feedback
- Hover dourado excessivo nos filtros suavizado (opacidade, não ouro).
  Justificação: microinteração discreta, não espetáculo.
- Mensagens de toast mais descritivas (ex.: "Cliente adicionado à lista" em vez de genérico).
  Justificação: feedback claro sem linguagem técnica (Nielsen heuristics).

### Componentes
- Botão Localizar: borda sólida do sistema, sem dashed que sugere template.
- `.modal-title` unificado (sans, peso 600).

## Não alterado
- Regras de negócio
- Identidade BeautyPro (dourado, tokens, layout)
- Funcionalidades
- Aba IA (conteúdo)

## Veredito de produto
A interface comunica um único sistema. Residuais de MVP/emoji/pseudo-ícone/tipografia arbitrária foram removidos.
