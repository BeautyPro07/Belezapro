# GUIA — O que ainda depende de ti / próxima passagem

## Já corrigido e incluído neste ZIP (Fase E)
- Venda a falhar → corrigido
- Contador de pendentes no Resumo → corrigido (só agendados futuros)
- Sparkline + % → reimplementados inteligentes com o filtro
- Fundo inicial = 0
- Filtro Agenda: "Não realizados" (sem emoji)
- Clique no cliente → perfil só leitura
- Store + deletes (Fase D)

## Como testar já
1. Hard refresh / limpar SW (v10)
2. Registar uma venda com cliente + profissional + itens → deve gravar e mostrar sucesso
3. No Resumo, muda o filtro do faturamento → a % do ticket e a linha devem mudar
4. Agenda sem agendamentos futuros → "0 pendentes"
5. Clique num cliente → modal de perfil só visualização
6. Fundo de caixa novo salão / reset → 0 Kz

## Ainda por completar (próxima ronda ou manual)
Estas itens precisam de mais HTML/CSS e tempo de integração cuidadosa para não regressar:

1. **Aba Caixa — filtro tipo Resumo + pesquisa de cliente**
   - Adicionar popover idêntico ao do dashboard
   - Campo "Localizar" que exige período antes de filtrar
   - Modal branco limpo "Não encontrei o cliente..."

2. **Aba Equipa**
   - Renomear "Data de nascimento" → "Data contratual" (input texto / spinners, sem datepicker nativo se preferires)
   - Especialidade = lista dos serviços existentes + opção "Criar seu serviço" (cria serviço + associa)
   - Validar BI e telefone 9 dígitos no save (funções `validarBI` / `validarTelefoneAO` já existem em eventos-cadastros.js)
   - Clique no funcionário → modal detalhe só leitura (padrão igual ao cliente)

3. **Serviços**
   - Impedir criação sem pelo menos 1 profissional associado
   - Melhorar visual do modal de edição

4. **Botões "Finalizar atendimento" / recibo**
   - Ajuste fino de tipografia e enquadramento (CSS)

5. **RLS Supabase** — seguir `GUIA_DE_IMPLEMENTAÇÃO.md` (Fase D)

Quando quiseres a próxima ronda focada só nestes 5 pontos, envia o ZIP actualizado e o pedido específico.
