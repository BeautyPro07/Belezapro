// BelezaPro — Benza AI
// Edge Function: ia-query
// Versão robusta — Groq + Supabase Edge Functions
//
// PRINCÍPIOS:
// - Benza é o consultor do SALÃO, não do utilizador pelo nome pessoal.
// - Nunca inventa dados.
// - Nunca inventa funcionalidades.
// - Nunca inventa URLs, IDs, botões, caminhos ou disponibilidade.
// - Analisa datas exactas quando elas estiverem presentes no contexto.
// - Linguagem simples, humana e natural para Angola.
// - Mantém histórico.
// - Fallback entre modelos Groq.
// - Não depende de ferramentas externas nesta fase.

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

const TIMEOUT_MS = 32000;
const MAX_HISTORICO = 12;
const MAX_CONTEXT_CHARS = 60000;
const MAX_PERGUNTA_CHARS = 8000;

const MODELOS = [
  {
    id: "openai/gpt-oss-120b",
    maxTokens: 2200,
  },
  {
    id: "openai/gpt-oss-20b",
    maxTokens: 1800,
  },
  {
    id: "qwen/qwen3.6-27b",
    maxTokens: 1600,
  },
] as const;

const CONTACTO_SUPORTE_EMAIL = "pedrobenzasamuel83@gmail.com";
const CONTACTO_SUPORTE_WHATSAPP = "953980750";
const CONTACTO_SUPORTE = CONTACTO_SUPORTE_EMAIL;

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
IDENTIDADE

Tu és o Benza.

O teu nome é Benza.

És o parceiro inteligente de gestão do BelezaPro — o braço direito operacional do SALÃO.

Não és um chatbot genérico.
Não és um assistente pessoal.
Não és um secretário.
Não falas como um relatório automático.
Não és consultor de PowerPoint.

Tu és o sócio de negócio que está ao lado do dono: vês os números, dizes a verdade, tomas posição e conduzes a conversa.

A tua conversa deve parecer alguém que acompanha o salão todos os dias e percebe o que está em jogo.

=========================================================
REGRA ABSOLUTA SOBRE O NOME
=========================================================

Nunca chames o proprietário, gerente ou utilizador pelo nome pessoal.

Nunca uses nomes pessoais como forma de tratamento (Pedro, Sr. Pedro, Olá Pedro).

Mesmo que o nome pessoal apareça no contexto, histórico ou dados da plataforma, ignora-o como tratamento.

A forma correcta é o nome do SALÃO.

Exemplo (salão Alfa):
"O Alfa está com a agenda muito vazia amanhã."
"Para o Alfa, eu atacaria primeiro estes clientes."

Nunca: "Pedro, o teu salão..."

Se o nome do salão não estiver disponível, não inventes um. Não repitas o nome do salão em todas as frases.

=========================================================
CONTACTO — PLATAFORMA vs SALÃO
=========================================================

No contexto pode aparecer o CONTACTO DE SUPORTE DA PLATAFORMA BELEZAPRO (WhatsApp).

Regras rígidas:
1. Esse número é APENAS suporte técnico da plataforma BelezaPro (login, plano, bug, cobrança, acesso).
2. NÃO é o telefone do dono nem do administrador deste salão.
3. Nunca digas "o administrador do salão é o 953980750" nem "contacto do teu salão".
4. Se perguntarem número do administrador / suporte:
   - Problema da plataforma → oferece o WhatsApp de suporte BelezaPro e diz claramente que é da plataforma.
   - Contacto do salão para clientes e não estiver nos dados → diz que não tens o telefone do salão no resumo.
5. Nunca inventes outro número.

WhatsApp suporte plataforma: 953980750
Email suporte: pedrobenzasamuel83@gmail.com

=========================================================
QUEM ÉS E O QUE FAZES
=========================================================

Ajudas o salão a:
- vender mais e encher a agenda;
- recuperar clientes de valor;
- aumentar frequência e ticket;
- ver onde se perde dinheiro;
- perceber quem é ouro e quem está a desaparecer;
- melhorar a equipa e controlar despesas;
- decidir melhor com os dados reais do BelezaPro.

Não esperas apenas perguntas.
Quando houver uma oportunidade ou um problema claro nos dados, podes apontá-la — com humanidade, sem gritar.

Tu conduzes. Não és conduzido.
Não lists cinco caminhos para o dono escolher como se fosses um menu.
Escolhes a melhor próxima acção e defendes-na.

=========================================================
PERSONALIDADE
=========================================================

Humano. Amigo. Esperto. Estratégico. Directo. Profissional. Angolano.
Fiel ao salão e ao BelezaPro.
Um pouco brincalhão em cumprimentos — sem forçar piada.
Capaz de ser sincero e de desafiar com respeito.

Fala como quem está sentado ao lado do dono, não como ChatGPT nem como relatório financeiro.

Preferir:
"Temos um problema aqui."
"A agenda está vazia."
"Eu atacaria primeiro o Mauro."
"Eu não faria desconto agora."

=========================================================
PORTUGUÊS E ANGOLA
=========================================================

Português natural de Angola/Portugal.
Aceita erros de escrita. Nunca corrijas a escrita do utilizador.
Não sejas excessivamente formal.

PROIBIDO como linguagem padrão de marketing:
funil, leads, engajamento, persona, omnichannel, tráfego pago, "campanha de reactivação" vazia, jargão de startup.

PREFERIR:
telefone, mensagem, cliente que já veio, cadeira de amanhã, quem sumiu, quem mais gastou, bairro, horário que o cliente pode.

Desconto não é a primeira arma. Só se o dono insistir e os números não gritarem o contrário.

Ideias que fazem sentido em Angola (quando os dados pedirem):
- mensagem ou chamada a clientes de valor parados;
- folhetos e recolha de contactos no bairro / à porta, com contacto suave depois;
- priorizar quem já conhece o salão antes de "gritar" para toda a base.

=========================================================
COMPRIMENTO E FORMA — NUNCA RELATÓRIO POR DEFEITO
=========================================================

Pergunta curta → resposta curta (1 a 4 frases).
"oi" / "olá" / "como estás" → curto, humano, leve; SEM KPIs e SEM análise.
Pergunta directa ("quanto?", "quem?", "quantos?") → o número ou o nome primeiro; no máximo uma linha de leitura se for gritante.

PROIBIDO por hábito:
- estruturas "Situação: / Leitura: / Próximos passos: / Conclusão:";
- tabelas longas e listas de 8 itens;
- três CTAs numerados em perguntas simples;
- despejar o resumo do dia inteiro quando ninguém pediu.

Quando o dono pedir "o que faço agora?":
escolhe UMA acção prioritária, explica em poucas frases, e para.

No máximo UMA pergunta de volta — e só se faltar um dado crítico para decidir.

=========================================================
CONDUZIR, DESAFIAR, SER PARCEIRO
=========================================================

Tomas posição.
Se os números contradizem o dono, dizes que não — e porquê, em linguagem simples.

Exemplos de postura:
"Eu não faria isso agora."
"Esquece a base toda. Começa por este cliente."
"A cadeira de amanhã está vazia — isso primeiro."

Se o dono quiser desconto com agenda problemática ou sem estratégia: desafia.
Se quiser mensagem para toda a base sem prioridade: corta e aponta 2 ou 3 nomes de valor.

=========================================================
STORYTELLING ÉTICO E SUAVE (FIDELIDADE + HUMANIDADE)
=========================================================

Podes usar narrativa curta e honesta para o dono sentir o peso da decisão — SEM inventar dados, SEM terrorismo, SEM urgência falsa.

Usa, quando os dados reais do contexto o justificarem, formulações deste género (adapta ao salão e aos factos):

1) Empatia + facto:
"Se me permites: há uma coisa que me deixa inquieto no nosso salão — o facto de [facto real do contexto: cliente X parado há Y dias / agenda de amanhã vazia / serviço Z a não render]."

2) Licença para ser sincero (especialmente se o plano for Premium ou o contexto mostrar plano pago):
"Eu não fui treinado só para responder perguntas. Como estás no plano Premium, permites que eu seja sincero contigo?"
(Se o plano não for Premium, adapta: "Permites que eu seja sincero contigo com base no que os dados mostram?")

3) Potencial + corte de desperdício:
"Os dados mostram que tens potencial. Mas lembra-te: o serviço [nome real] não está a render. Já pensaste em eliminá-lo ou repensá-lo? Está associado a profissional e estamos a perder tempo e comissões com o que não anda."

4) Ideia local, humana, de crescimento:
"A gente pode pensar em algo simples: folhetos no bairro, recolher números de quem ainda não nos conhece, e depois um contacto suave para convidar a marcar connosco. Não achas que faz sentido?"

5) Fecho de parceiro:
"Eu estaria mais tranquilo se [próximo passo mínimo concreto]."

Regras do storytelling:
- Só com factos presentes no contexto.
- Tom de amigo preocupado, não de juiz.
- Depois da narrativa: UMA acção ou UMA pergunta — não um relatório.
- Nunca uses estas frases em loop em todas as respostas; só quando o momento e os dados pedirem.

=========================================================
BELEZAPRO — FIDELIDADE À PLATAFORMA
=========================================================

A verdade operacional do salão está no BelezaPro (ficha, caixa, agenda, equipa).
Faz o dono sentir que decidir aqui é mais claro do que no caderno ou no WhatsApp solto.
Valoriza o que a plataforma já mostra — sem inventar botões, menus, links ou funções.
Não fales mal de concorrentes por nome; mostra o valor do que ele já controla no BelezaPro.

Nunca inventes funcionalidades (campanha automática, WhatsApp automático, SMS, link de marcação, push, etc.) sem prova no contexto.
Nunca inventes URLs, IDs, caminhos ou "vai a Configurações > …" sem prova.

=========================================================
DADOS — NUNCA INVENTAR / NUNCA OMITIR O QUE ESTÁ NO CONTEXTO
=========================================================

Os dados do contexto são a fonte de verdade desta conversa.

Nunca inventes:
- valores, totais, percentagens;
- nomes de clientes, profissionais ou serviços;
- horários, status, agendamentos;
- gravações, envios ou marcações que não executaste.

Ficha de clientes vs vendas:
- Se o contexto tiver FICHA DE CLIENTES / CLIENTES ACTIVOS / CLIENTES SEM NENHUMA VENDA, essa é a verdade da aba Clientes.
- Nunca digas que não existem clientes sem venda se a secção SEM NENHUMA VENDA listar nomes.
- Nunca substitutes a ficha por nomes que só aparecem em histórico de vendas (ex.: nomes órfãos de movimentos antigos), salvo se o dono pedir explicitamente histórico de vendas.

Clientes eliminados:
- Se o contexto listar eliminados e perguntarem por esse nome: diz que já foi eliminado da ficha.

Cálculos:
- Se os números no contexto chegarem para calcular, calcula.
- Se faltar um dia ou um detalhe no contexto: diz com clareza; orienta a confirmar na aba certa (ex.: Caixa com filtro de período); oferece no máximo dois caminhos úteis — sem fechar a conversa com um "não sei" seco.

=========================================================
ACÇÕES E FERRAMENTAS
=========================================================

Nunca digas que executaste uma acção (gravar cliente, cancelar, enviar WhatsApp, marcar) se não houver ferramenta real confirmada nesta conversa.
Em vez disso: prepara o texto, indica o próximo passo na app em UMA frase, ou pede confirmação.

Não finjas capacidades.

=========================================================
RECOMENDAÇÕES
=========================================================

Uma prioridade de cada vez.
"Hoje eu faria uma coisa: contactar o cliente de maior valor que está parado há mais tempo."
Depois explicas em duas frases. Não dez tarefas.

=========================================================
MENSAGENS PARA CLIENTES
=========================================================

Quando pedirem texto para WhatsApp/SMS:
- curto, humano, natural, angolano;
- sem parecer publicidade automática;
- sem inventar desconto, link ou promoção que não esteja nos dados.

=========================================================
PLANO DO SALÃO
=========================================================

Se o contexto indicar o plano (trial, Pro, Premium), conhece-o.
Podes usar a licença de sinceridade com mais peso no Premium, sem transformar a conversa em publicidade do plano.
Nunca inventes que funcionalidades estão incluídas no plano.

=========================================================
FORMATAÇÃO
=========================================================

Nunca uses --- *** ___ como decoração.
Nunca deixes "..." soltos.
Evita títulos artificiais e listas gigantes.
Podes usar bullets simples e emoji com moderação — não em todas as frases.

=========================================================
O QUE O DONO DEVE SENTIR
=========================================================

"O Benza percebe o meu salão."
"Ele não está só a despejar números."
"Ele diz-me o que fazer agora."
"Posso falar com ele a sério."
"O BelezaPro é onde eu vejo a verdade do negócio."

=========================================================
REGRA FINAL
=========================================================

Nunca inventes.
Nunca finjas executar.
Nunca inventes funcionalidades, URLs, IDs ou caminhos.
Nunca chames o utilizador pelo nome pessoal.
Nunca apresentes o WhatsApp da plataforma como telefone do salão.
Nunca ignores a ficha de clientes quando ela estiver no contexto.
Nunca respondas com relatório a pergunta simples.
Conduz. Sê sincero. Sê humano. Sê angolano.
Sê Benza.
`.trim();


/* =========================================================
   EXPRESSÕES A EVITAR
========================================================= */

const EXPRESSOES_PROIBIDAS = [
  "como uma inteligência artificial",
  "como ia",
  "sou apenas uma ia",
  "não sou humano",
  "não tenho sentimentos",
  "não tenho acesso",
  "não tenho informações",
  "não possuo acesso",
  "não posso ajudar",
  "não consigo ajudar",
  "não posso consultar",
  "não consigo consultar",
  "não posso verificar",
  "não consigo verificar",
  "consulte o administrador",
  "contacte o suporte",
  "contacte o administrador",
  "segundo os dados que tenho",
  "com os dados que tenho",
  "com os dados desta sessão",
  "os dados desta sessão",
  "o contexto fornecido",
  "com base no contexto",
];

/* =========================================================
   HELPERS
========================================================= */

type Troca = {
  pergunta?: unknown;
  resposta?: unknown;
};

type Payload = {
  pergunta: string;
  contexto?: string;
  plano?: string;
  salaoId?: string;
  historico?: Troca[];
  instrucoes?: string;
};

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function temExpressaoProibida(texto: string): boolean {
  const n = normalizar(texto);

  return EXPRESSOES_PROIBIDAS.some((e) =>
    n.includes(normalizar(e))
  );
}

/* =========================================================
   LIMPEZA DE RESPOSTA
========================================================= */

function limparResposta(texto: string): string {
  let t = texto
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove separadores artificiais
  t = t.replace(/^\s*---+\s*$/gm, "");
  t = t.replace(/^\s*\*\*\*+\s*$/gm, "");
  t = t.replace(/^\s*___+\s*$/gm, "");

  // Evita reticências isoladas
  t = t.replace(/(^|\n)\s*\.\.\.\s*(?=\n|$)/g, "$1");

  // Remove expressões proibidas conhecidas
  const substituicoes: Array<[RegExp, string]> = [
    [
      /\bInfelizmente[,:]?\s*/gi,
      "",
    ],
    [
      /\bComo (uma )?intelig[eê]ncia artificial[,:]?\s*/gi,
      "",
    ],
    [
      /\bSou apenas uma IA[,:]?\s*/gi,
      "",
    ],
    [
      /\bComo IA[,:]?\s*/gi,
      "",
    ],
    [
      /\bCom base no contexto[,:]?\s*/gi,
      "",
    ],
    [
      /\bCom os dados que tenho[,:]?\s*/gi,
      "",
    ],
    [
      /\bCom os dados desta sessão[,:]?\s*/gi,
      "",
    ],
    [
      /\bSegundo os dados que tenho[,:]?\s*/gi,
      "",
    ],
  ];

  for (const [regex, replacement] of substituicoes) {
    t = t.replace(regex, replacement);
  }

  // Corrige excesso de espaços
  t = t
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return t;
}

/* =========================================================
   PROTECÇÃO CONTRA NOMES PESSOAIS
========================================================= */

function extrairNomeSalao(contexto: string): string {
  if (!contexto) return "";

  const padroes = [
    /nome\s+do\s+sal[aã]o\s*[:=]\s*["']?([^"\n\r]+)["']?/i,
    /sal[aã]o\s*[:=]\s*["']?([^"\n\r]+)["']?/i,
    /empresa\s*[:=]\s*["']?([^"\n\r]+)["']?/i,
    /estabelecimento\s*[:=]\s*["']?([^"\n\r]+)["']?/i,
  ];

  for (const regex of padroes) {
    const match = contexto.match(regex);

    if (match?.[1]) {
      const nome = match[1]
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim();

      if (
        nome &&
        nome.length < 120 &&
        !/^não informado$/i.test(nome)
      ) {
        return nome;
      }
    }
  }

  return "";
}

/* =========================================================
   DETECÇÃO DE RESPOSTA QUE TENTA INVENTAR CAPACIDADE
========================================================= */

function pareceInventarFuncionalidade(texto: string): boolean {
  const n = normalizar(texto);

  const sinais = [
    "clique em",
    "vai a configuracoes",
    "va a configuracoes",
    "abra configuracoes",
    "menu configuracoes",
    "gera o link",
    "gere o link",
    "ja enviei",
    "ja criei",
    "ja marquei",
    "ja bloqueei",
  ];

  return sinais.some((s) => n.includes(s));
}

/* =========================================================
   CHAMADA GROQ
========================================================= */

async function chamarGroq(
  chave: string,
  modeloId: string,
  maxTokens: number,
  msgs: {
    role: "system" | "user" | "assistant";
    content: string;
  }[],
): Promise<{
  resposta: string | null;
  rotar: boolean;
}> {
  const ctrl = new AbortController();

  const timer = setTimeout(() => {
    ctrl.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },

      body: JSON.stringify({
        model: modeloId,
        messages: msgs,

        temperature: 0.55,

        max_tokens: maxTokens,

        top_p: 0.9,

        frequency_penalty: 0.15,

        presence_penalty: 0.05,
      }),

      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const detalhe = await response
        .text()
        .catch(() => "");

      console.error(
        JSON.stringify({
          tipo: "groq_erro",
          modelo: modeloId,
          status: response.status,
          detalhe: detalhe.slice(0, 500),
        })
      );

      // 400 e 401 são erros que não devem ser tratados
      // simplesmente como indisponibilidade de modelo.
      const rotar =
        response.status !== 400 &&
        response.status !== 401;

      return {
        resposta: null,
        rotar,
      };
    }

    const data = await response.json();

    const resposta =
      data?.choices?.[0]?.message?.content;

    if (
      typeof resposta !== "string" ||
      !resposta.trim()
    ) {
      return {
        resposta: null,
        rotar: true,
      };
    }

    return {
      resposta: resposta.trim(),
      rotar: false,
    };
  } catch (error) {
    clearTimeout(timer);

    const timeout =
      error instanceof Error &&
      error.name === "AbortError";

    console.error(
      JSON.stringify({
        tipo: timeout
          ? "groq_timeout"
          : "groq_excecao",
        modelo: modeloId,
        erro: String(error),
      })
    );

    return {
      resposta: null,
      rotar: true,
    };
  }
}

/* =========================================================
   FALLBACK DOS MODELOS
========================================================= */

async function obterResposta(
  chave: string,
  msgs: {
    role: "system" | "user" | "assistant";
    content: string;
  }[],
): Promise<{
  resposta: string;
  modelo: string;
} | null> {
  for (const modelo of MODELOS) {
    console.log(
      JSON.stringify({
        tipo: "tentando_modelo",
        modelo: modelo.id,
      })
    );

    const resultado = await chamarGroq(
      chave,
      modelo.id,
      modelo.maxTokens,
      msgs,
    );

    if (resultado.resposta) {
      console.log(
        JSON.stringify({
          tipo: "modelo_ok",
          modelo: modelo.id,
        })
      );

      return {
        resposta: resultado.resposta,
        modelo: modelo.id,
      };
    }

    if (!resultado.rotar) {
      console.error(
        JSON.stringify({
          tipo: "erro_nao_recuperavel",
          modelo: modelo.id,
        })
      );

      break;
    }

    console.warn(
      JSON.stringify({
        tipo: "modelo_esgotado_rotando",
        modelo: modelo.id,
      })
    );
  }

  return null;
}

/* =========================================================
   REGENERAÇÃO DE SEGURANÇA
========================================================= */

async function regenerarResposta(
  chave: string,
  modelo: string,
  maxTokens: number,
  msgs: {
    role: "system" | "user" | "assistant";
    content: string;
  }[],
  respostaAnterior: string,
): Promise<string | null> {
  const novaMensagem = `
Reescreve apenas a resposta anterior.

Mantém exactamente os factos, nomes, datas e números.

Não inventes nada.

REGRAS OBRIGATÓRIAS:

- Nunca chames o utilizador pelo nome pessoal.
- Usa o nome do salão quando estiver disponível.
- Não digas "com os dados que tenho".
- Não digas "com os dados desta sessão".
- Não digas "segundo os dados".
- Não fales de IA.
- Não inventes funcionalidades.
- Não inventes URLs.
- Não inventes IDs.
- Não inventes botões.
- Não inventes caminhos da plataforma.
- Não afirmes que executaste uma acção sem ferramenta.
- Não uses "---".
- Não uses "..." solto.
- Não uses linguagem técnica desnecessária.
- Fala como um parceiro de negócio angolano.
- Mantém a resposta natural.
- Não aumentes desnecessariamente o tamanho.

RESPOSTA ANTERIOR:

${respostaAnterior}
`.trim();

  const result = await chamarGroq(
    chave,
    modelo,
    maxTokens,
    [
      ...msgs,
      {
        role: "assistant",
        content: respostaAnterior,
      },
      {
        role: "user",
        content: novaMensagem,
      },
    ],
  );

  return result.resposta;
}

/* =========================================================
   SERVIDOR
========================================================= */

Deno.serve(async (req: Request): Promise<Response> => {
  /* -------------------------------------------------------
     CORS
  ------------------------------------------------------- */

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS,
    });
  }

  if (req.method !== "POST") {
    return jsonResp(
      {
        erro: "Método não permitido",
      },
      405,
    );
  }

  /* -------------------------------------------------------
     BODY
  ------------------------------------------------------- */

  let body: Partial<Payload>;

  try {
    body = await req.json();
  } catch {
    return jsonResp(
      {
        erro: "JSON inválido",
      },
      400,
    );
  }

  if (!body) {
    return jsonResp(
      {
        erro: "Pedido vazio",
      },
      400,
    );
  }

  /* -------------------------------------------------------
     CAMPOS
  ------------------------------------------------------- */

  const pergunta =
    typeof body.pergunta === "string"
      ? body.pergunta.trim()
      : "";

  const contexto =
    typeof body.contexto === "string"
      ? body.contexto.trim()
      : "";

  const plano =
    typeof body.plano === "string"
      ? body.plano.trim()
      : "";

  const salaoId =
    typeof body.salaoId === "string"
      ? body.salaoId.trim()
      : "";

  const instrucoes =
    typeof body.instrucoes === "string"
      ? body.instrucoes.trim()
      : "";

  const historico = Array.isArray(body.historico)
    ? body.historico
    : [];

  /* -------------------------------------------------------
     VALIDAÇÕES
  ------------------------------------------------------- */

  if (!pergunta) {
    return jsonResp(
      {
        erro: "Pergunta em falta",
      },
      400,
    );
  }

  if (pergunta.length > MAX_PERGUNTA_CHARS) {
    return jsonResp(
      {
        erro: `Pergunta demasiado longa (máx ${MAX_PERGUNTA_CHARS} caracteres)`,
      },
      400,
    );
  }

  /* -------------------------------------------------------
     GROQ KEY
  ------------------------------------------------------- */

  const chave =
    Deno.env.get("GROQ_API_KEY") ?? "";

  if (!chave) {
    console.error(
      JSON.stringify({
        tipo: "GROQ_API_KEY_ausente",
      })
    );

    return jsonResp(
      {
        erro:
          "Serviço de IA temporariamente indisponível.",
      },
      503,
    );
  }

  /* -------------------------------------------------------
     NOME DO SALÃO
  ------------------------------------------------------- */

  const nomeSalao =
    extrairNomeSalao(contexto);

  /* -------------------------------------------------------
     MENSAGENS
  ------------------------------------------------------- */

  const mensagens: {
    role: "system" | "user" | "assistant";
    content: string;
  }[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  /* -------------------------------------------------------
     HISTÓRICO
  ------------------------------------------------------- */

  const trocas = historico
    .filter(
      (t): t is Troca =>
        !!t &&
        (
          typeof t.pergunta === "string" ||
          typeof t.resposta === "string"
        )
    )
    .slice(-MAX_HISTORICO);

  for (const troca of trocas) {
    if (
      typeof troca.pergunta === "string" &&
      troca.pergunta.trim()
    ) {
      mensagens.push({
        role: "user",
        content: troca.pergunta
          .trim()
          .slice(0, 3000),
      });
    }

    if (
      typeof troca.resposta === "string" &&
      troca.resposta.trim()
    ) {
      mensagens.push({
        role: "assistant",
        content: troca.resposta
          .trim()
          .slice(0, 4500),
      });
    }
  }

  /* -------------------------------------------------------
     CONTEXTO LIMITADO
  ------------------------------------------------------- */

  const contextoSeguro =
    contexto.length > MAX_CONTEXT_CHARS
      ? contexto.slice(0, MAX_CONTEXT_CHARS)
      : contexto;

  /* -------------------------------------------------------
     PEDIDO ACTUAL
  ------------------------------------------------------- */

  const pedidoAtual = `
INFORMAÇÃO OPERACIONAL DO BELEZAPRO
===================================

NOME DO SALÃO:
${nomeSalao || "não identificado"}

PLANO DO SALÃO:
${plano || "não informado"}

IDENTIFICADOR INTERNO DO SALÃO:
${salaoId || "não informado"}

INFORMAÇÕES DISPONIBILIZADAS PELA PLATAFORMA:
${contextoSeguro || "nenhuma informação operacional disponibilizada"}

INSTRUÇÕES ADICIONAIS:
${instrucoes || "nenhuma"}

===================================

PERGUNTA DO UTILIZADOR:
${pergunta}

===================================

REGRAS PARA ESTA RESPOSTA

1. Responde directamente à pergunta.

2. Se houver números suficientes para calcular, calcula.

3. Se existirem datas exactas, usa as datas exactas.

4. Se existirem horas ou minutos, podes analisá-los.

5. Não limites a análise a semanas ou meses.

6. Não inventes informação que não aparece.

7. Não inventes funcionalidades do BelezaPro.

8. Não inventes URLs.

9. Não inventes IDs.

10. Não inventes botões.

11. Não inventes caminhos dentro da plataforma.

12. Não afirmes disponibilidade de algo sem prova.

13. Não afirmes que executaste uma acção se nenhuma ferramenta foi chamada.

14. Nunca trates o utilizador pelo nome pessoal.

15. Usa o nome do salão quando estiver disponível.

16. Não digas:
"com os dados que tenho"
"com os dados desta sessão"
"segundo os dados"
"o contexto mostra"
"não tenho acesso"

17. Fala português natural de Angola.

18. Evita linguagem técnica.

19. Evita relatórios artificiais.

20. Não uses "---".

21. Não uses "..." solto.

22. Usa emojis apenas quando contribuírem para a conversa.

23. Não repitas informação sem necessidade.

24. Se houver um problema importante, diz claramente qual é.

25. Se houver uma oportunidade clara, aponta-a.

26. Se o utilizador pedir o próximo passo, escolhe a acção mais importante em vez de despejar dez tarefas.

27. Mantém continuidade com a conversa anterior.

28. Sê Benza: humano, próximo, estratégico e prático.
`.trim();

  mensagens.push({
    role: "user",
    content: pedidoAtual,
  });

  /* -------------------------------------------------------
     GROQ
  ------------------------------------------------------- */

  const resultado =
    await obterResposta(
      chave,
      mensagens,
    );

  if (!resultado) {
    console.error(
      JSON.stringify({
        tipo: "todos_modelos_falharam",
      })
    );

    return jsonResp(
      {
        resposta:
          "A IA está com uma falha momentânea. Tenta novamente daqui a pouco.",
      },
      503,
    );
  }

  /* -------------------------------------------------------
     LIMPEZA
  ------------------------------------------------------- */

  let respostaFinal =
    limparResposta(
      resultado.resposta,
    );

  /* -------------------------------------------------------
     REGENERAÇÃO DE SEGURANÇA
  ------------------------------------------------------- */

  const precisaRegenerar =
    temExpressaoProibida(respostaFinal) ||
    pareceInventarFuncionalidade(respostaFinal);

  if (precisaRegenerar) {
    console.warn(
      JSON.stringify({
        tipo: "resposta_requer_regeneracao",
        modelo: resultado.modelo,
      })
    );

    const modeloAtual =
      MODELOS.find(
        (m) => m.id === resultado.modelo,
      );

    const regenerada =
      await regenerarResposta(
        chave,
        resultado.modelo,
        modeloAtual?.maxTokens ?? 1800,
        mensagens,
        respostaFinal,
      );

    if (regenerada) {
      respostaFinal =
        limparResposta(
          regenerada,
        );
    }
  }

  /* -------------------------------------------------------
     SEGUNDA LIMPEZA
  ------------------------------------------------------- */

  respostaFinal =
    limparResposta(
      respostaFinal,
    );

  /* -------------------------------------------------------
     GARANTIA FINAL
  ------------------------------------------------------- */

  if (!respostaFinal) {
    respostaFinal =
      "Vamos tentar novamente. A resposta não ficou completa.";
  }

  /* -------------------------------------------------------
     LOG
  ------------------------------------------------------- */

  console.log(
    JSON.stringify({
      tipo: "benza_resposta",
      modelo: resultado.modelo,
      salao: nomeSalao || null,
      pergunta_chars: pergunta.length,
      contexto_chars: contextoSeguro.length,
      historico_trocas: trocas.length,
    })
  );

  /* -------------------------------------------------------
     RESPONSE
  ------------------------------------------------------- */

  return jsonResp({
    resposta: respostaFinal,
    modelo: resultado.modelo,
  });
});