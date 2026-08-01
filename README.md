# Pacote robusto — UI fotos/CRM + lazy galeria (revisão cirúrgica)

## Fragilidades da versão anterior e correcções

### Galeria lazy
| Antes | Agora |
|-------|--------|
| Observer no *viewport* (modal scroll ignorado) | `root` = contentor com overflow do modal |
| `src`/data-src sem escape | `bpGalEscAttr` |
| Re-render deixava observers em nós mortos | `bpGalDisconnect()` no início de `renderGaleria` |
| data: e remote tratados igual | data: sempre eager; remote: 4 eager + resto lazy |
| `src=""` possível | `bpGalSrc` + placeholder SVG estável |
| onload em cache incompleto | `complete && naturalWidth` |
| CSS misturava eager com opacity baixa | classes `pending` / `loaded` / `error` claras |

### Fotos sync / ficha
| Antes | Agora |
|-------|--------|
| `foto: null` no fromSupabase | removido |
| merge podia perder data URL local | merge preserva `foto` data: e `foto_url` |
| img no hero sem escape | atributo escapado + lazy |

### Modal venda
| Antes | Agora |
|-------|--------|
| `display:flex` sem limpar | `closeModal` limpa display |
| backdrop frágil | só se `target` for o overlay; Escape fecha |

### CRM
Exports `open*` reais em BPOps/Equipa/Finance/Gestão/Marketing + acordeão.

## Deploy
app.bundle.js + index.html + login-carrinho-venda.css  
Hard refresh / limpar cache SW.
