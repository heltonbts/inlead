export type Gender = "homem" | "mulher";

// Texto que pode ser igual pra todos ou variar por gênero.
export type GText = string | { homem: string; mulher: string };

export function pickText(value: GText | undefined, gender: Gender): string {
  if (value == null) return "";
  return typeof value === "string" ? value : value[gender];
}

export type QuizOption = {
  id: string;
  // Emojis já vão embutidos no texto pra simplificar.
  label: GText;
  description?: GText;
};

type SliderUnit = {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
  suffix: string;
};

type StepBase = {
  id: string;
  title: GText;
  subtitle?: GText;
  note?: GText; // observação pequena exibida abaixo do conteúdo
  onlyFor?: Gender; // etapa exclusiva de um gênero
};

export type QuizStep =
  | (StepBase & { type: "single"; options: QuizOption[] })
  | (StepBase & { type: "multi"; options: QuizOption[] })
  | (StepBase & { type: "text" | "phone"; placeholder: string; required?: boolean })
  | (StepBase & { type: "slider"; units: SliderUnit[] })
  | (StepBase & { type: "info"; body: GText; cta: GText });

type FunnelConfig = {
  brandName: string;
  logoUrl: string;
  leadEndpoint: string;
  facebookPixelId: string;

  // Destino do CTA final (VSL / página de oferta / checkout).
  checkoutUrl: string;

  // Profissional responsável (usado na prova de autoridade e no rodapé legal).
  professional: { name: string; crn: string };

  // Nº REAL de pessoas atendidas. Deixe vazio até ter o número confirmado.
  // {n} no texto da etapa "possibilidade" usa esse valor.
  socialProofCount: string;

  // Rodapé de compliance exibido nas telas de promessa.
  complianceFooter: string;

  whatsapp: { number: string; message: string };

  texts: {
    next: string;
    submit: string;
    submitting: string;
    backLabel: string;
    required: string;
    multiHint: string;
    errorTitle: string;
    errorText: string;
  };

  // Tela inicial: escolha do caminho (homem / mulher).
  gender: {
    eyebrow: string;
    title: string;
    subtitle: string;
    options: { id: Gender; label: string }[];
  };

  // Tela de loading ("analisando suas respostas").
  loading: {
    title: GText; // {nome}
    items: string[];
  };

  // Captura do WhatsApp (depois do loading).
  capture: {
    title: GText; // {nome}
    subtitle: string;
    placeholder: string;
    cta: string;
    secure: string;
  };

  // Página de resultado: diagnóstico honesto + oferta.
  result: {
    headline: GText; // {nome}
    subhead: string;
    // Bloco de diagnóstico por objetivo (chave = id da opção de objetivo).
    diagnosisByObjetivo: Record<string, string>;
    // Eco condicional: reescreve a resposta da etapa de identificação.
    echoByIdentificacao: Record<string, string>;
    closingTitle: string;
    closingBullets: GText[];
    closingNote: string;
    // Passo a passo de como funciona o método.
    howItWorks: {
      title: string;
      steps: { title: string; text: string }[];
    };
    // Empilhamento de valor: tudo o que a pessoa recebe.
    offer: {
      title: string;
      subtitle: string;
      includes: string[];
      guaranteeTitle: string;
      guarantee: string;
      scarcity: string;
    };
    cta: string;
    ctaNote: string;
    social: {
      title: string;
      subtitle: string;
      images: { homem: string[]; mulher: string[] };
      disclaimer: string;
    };
  };

  steps: QuizStep[];
};

export const CONFIG: FunnelConfig = {
  brandName: "Método Nutrido Para Sempre",
  logoUrl: "",
  leadEndpoint: "/api/leads",
  facebookPixelId: "1546268713221763",

  // Troque pelo link da sua VSL / página de oferta.
  checkoutUrl: "https://pay.kirvano.com/dc3ecc05-21a3-486f-bc0e-de24aae0b281",

  professional: { name: "João Victor Silva", crn: "CRN 15643" },

  // PREENCHA com o número REAL de atendimentos quando confirmado.
  socialProofCount: "",

  complianceFooter:
    "Resultados variam de pessoa para pessoa. Acompanhamento nutricional individualizado. João Victor Silva, CRN 15643.",

  whatsapp: {
    number: "5588992972504",
    message: "Oi! Fiz o quiz e quero meu plano personalizado. Meu nome é {nome}.",
  },

  texts: {
    next: "Continuar",
    submit: "VER MEU DIAGNÓSTICO",
    submitting: "Enviando...",
    backLabel: "Voltar",
    required: "Selecione uma opção para continuar.",
    multiHint: "Pode marcar mais de uma",
    errorTitle: "Não foi possível enviar",
    errorText: "Tente novamente em alguns instantes.",
  },

  gender: {
    eyebrow: "Diagnóstico gratuito · 1 minuto",
    title: "Vamos montar o seu diagnóstico",
    subtitle: "Primeiro, me diz pra quem é o plano:",
    options: [
      { id: "homem", label: "👨 Homem" },
      { id: "mulher", label: "👩 Mulher" },
    ],
  },

  loading: {
    title: "Analisando suas respostas, {nome}...",
    items: [
      "Entendendo seu objetivo e sua rotina",
      "Identificando o que mais te trava",
      "Montando seu diagnóstico personalizado",
    ],
  },

  capture: {
    title: "{nome}, seu diagnóstico está pronto. Pra onde envio?",
    subtitle: "Vou te mandar no WhatsApp, sem spam. Falo eu mesmo com você.",
    placeholder: "(00) 00000-0000",
    cta: "VER MEU DIAGNÓSTICO",
    secure: "🔒 Seus dados estão protegidos.",
  },

  result: {
    headline: "{nome}, aqui está o seu diagnóstico 🎯",
    subhead:
      "O que mais trava o seu resultado não é força de vontade. É método.",
    diagnosisByObjetivo: {
      "secar-barriga":
        "Você quer secar a barriga, mas vinha tentando com dieta genérica, e barriga não responde a “comer menos de qualquer jeito”. Responde a um plano ajustado ao seu corpo, com constância. É isso que vamos fazer.",
      leve:
        "Boa parte do que te incomoda é inchaço e retenção, não só gordura. Com a alimentação certa (e os alimentos certos pra VOCÊ), o corpo desincha e o resultado aparece de forma sustentável.",
      manter:
        "Seu histórico mostra o clássico efeito sanfona: perde e volta. O segredo não é dieta nova, é um método que você consiga manter. Foco total em constância e preservar massa magra.",
      bem:
        "Seu corpo está pedindo mais energia e saúde, não sofrimento. Vamos ajustar a alimentação pra você se sentir bem todos os dias, e a estética vem como consequência.",
    },
    echoByIdentificacao: {
      "tenho-plano":
        "Você mesmo disse: com o plano certo, você consegue. É exatamente isso que vou te entregar.",
      "sei-nao-mantenho":
        "Você disse que sabe o que fazer, mas não mantém. O problema nunca foi conhecimento, é ter um método que cabe na sua rotina.",
      metabolismo:
        "Você sente o metabolismo mais lento, por isso o plano é ajustado ao seu corpo, pra destravar o resultado.",
      acompanhamento:
        "Você funciona melhor com acompanhamento, e é assim que eu trabalho: perto de você.",
      "depois-40":
        "Depois dos 40 fica diferente, não impossível. O plano respeita a sua fase pra você voltar a evoluir.",
    },
    closingTitle: "O que muda o jogo no seu caso:",
    closingBullets: [
      "✔️ Cardápio montado pro seu objetivo, sua rotina e o que você gosta de comer",
      "✔️ Foco em constância: emagrecer e MANTER, sem efeito sanfona",
      "✔️ Feito por nutricionista de verdade (CRN 15643), não por robô nem fórmula pronta",
    ],
    closingNote:
      "Emagrecimento saudável é com consistência, não com milagre de 15 dias. E é assim que eu vou te ajudar.",
    howItWorks: {
      title: "Como funciona, passo a passo",
      steps: [
        {
          title: "Você preenche sua anamnese",
          text: "Conta sua rotina, seus horários, o que você gosta de comer e o que não pode. Leva poucos minutos e é o que deixa o plano realmente seu.",
        },
        {
          title: "Eu monto seu plano sob medida",
          text: "Eu mesmo, nutricionista (CRN 15643), monto seu cardápio pro seu objetivo e a sua realidade. Nada de PDF genérico nem fórmula pronta da internet.",
        },
        {
          title: "Você recebe no WhatsApp e já começa",
          text: "Seu plano chega organizado e fácil de seguir, com lista de compras pronta e substituições pra você não enjoar nem ficar perdido.",
        },
        {
          title: "A gente ajusta e mantém juntos",
          text: "Acompanhamento de perto pra corrigir a rota e manter a constância. É a constância, não o sacrifício, que traz o resultado que fica.",
        },
      ],
    },
    offer: {
      title: "O que você recebe",
      subtitle: "Um método completo pra emagrecer e manter, feito pra você.",
      includes: [
        "📋 Plano alimentar 100% personalizado pro seu objetivo e a sua rotina",
        "🛒 Lista de compras pronta e guia de substituições de alimentos",
        "💬 Acompanhamento por WhatsApp comigo, de verdade (não é robô)",
        "🔁 Ajustes sempre que precisar, pra não virar só mais uma tentativa",
        "🍽️ Estratégia pra dar conta da vida real: trabalho, eventos e fim de semana",
      ],
      guaranteeTitle: "O risco é meu, não seu",
      guarantee:
        "Meu compromisso é com o seu resultado, não com te empurrar mais uma dieta. Você segue o plano com suporte e, se precisar de ajuste, a gente ajusta até fazer sentido pra você.",
      scarcity:
        "Atendo um número limitado de pessoas por mês pra manter a qualidade do acompanhamento individual. Por isso pode fechar a qualquer momento.",
    },
    cta: "QUERO MEU PLANO PERSONALIZADO →",
    ctaNote: "Leva menos de 2 minutos pra garantir o seu.",
    social: {
      title: "Resultados reais de quem seguiu o método",
      subtitle: "Pessoas com a mesma rotina que a sua que mudaram a alimentação.",
      images: {
        homem: [
          "/transformacoes/11.png",
          "/transformacoes/1.webp",
          "/transformacoes/2.webp",
          "/transformacoes/4.webp",
          "/transformacoes/7.webp",
        ],
        mulher: [
          "/transformacoes/12.png",
          "/transformacoes/13.png",
          "/transformacoes/3.webp",
          "/transformacoes/5.webp",
          "/transformacoes/6.webp",
          "/transformacoes/8.webp",
          "/transformacoes/9.webp",
          "/transformacoes/10.webp",
        ],
      },
      disclaimer:
        "Imagens reais de alunos, usadas com autorização. Resultados variam de pessoa para pessoa.",
    },
  },

  steps: [
    {
      id: "nome",
      type: "text",
      title: "Como posso te chamar?",
      subtitle: "Vou personalizar tudo no seu nome.",
      placeholder: "Seu primeiro nome",
      required: true,
    },
    {
      id: "classificacao",
      type: "single",
      title: "Como você classificaria seu corpo hoje?",
      options: [
        { id: "muito-acima", label: "Muito acima do peso" },
        {
          id: "pouco-acima",
          label: {
            homem: "Um pouco acima do peso, barriga crescendo",
            mulher: "Um pouco acima do peso",
          },
        },
        {
          id: "falso-magro",
          label: {
            homem: "Falso magro: barriga aparece, mas o resto é ok",
            mulher: "Falsa magra: barriga aparece e não me sinto bem",
          },
        },
        {
          id: "secar",
          label: {
            homem: "Peso razoável, mas quero secar a barriga",
            mulher: "Peso ok, mas quero secar a barriga",
          },
        },
      ],
    },
    {
      id: "objetivo",
      type: "single",
      title: "Qual é o seu maior objetivo agora?",
      options: [
        {
          id: "secar-barriga",
          label: {
            homem: "🔥 Secar a barriga de vez",
            mulher: "🔥 Perder a barriga de vez",
          },
        },
        {
          id: "leve",
          label: {
            homem: "💪 Perder gordura e ganhar definição",
            mulher: "💧 Desinchar e me sentir mais leve",
          },
        },
        {
          id: "manter",
          label: {
            homem: "⚖️ Emagrecer sem perder massa muscular",
            mulher: "⚖️ Emagrecer e não engordar de volta",
          },
        },
        {
          id: "bem",
          label: {
            homem: "⚡ Melhorar minha saúde e energia",
            mulher: "🪞 Me sentir bem com meu corpo de novo",
          },
        },
      ],
    },
    {
      id: "corpo-dos-sonhos",
      type: "single",
      onlyFor: "mulher",
      title: "Qual é o seu corpo dos sonhos?",
      options: [
        { id: "magro", label: "Magro" },
        { id: "tonificado", label: "Tonificado" },
        { id: "curvilineo", label: "Curvilíneo" },
        { id: "medio", label: "Médio" },
      ],
    },
    {
      id: "identificacao",
      type: "single",
      title: "Com qual frase você mais se identifica?",
      subtitle: { homem: "(seja honesto)", mulher: "(seja honesta)" },
      options: [
        { id: "tenho-plano", label: "💪 Se eu tiver o plano certo, eu consigo" },
        { id: "sei-nao-mantenho", label: "😩 Sei o que fazer, mas não mantenho" },
        { id: "metabolismo", label: "🐢 Sinto que meu metabolismo é mais lento" },
        {
          id: "acompanhamento",
          label: "👀 Funciono melhor com alguém me acompanhando",
        },
        { id: "depois-40", label: "😮‍💨 Depois dos 40 ficou mais difícil" },
      ],
    },
    {
      id: "impacto",
      type: "multi",
      title: "Como o seu peso tem impactado a sua vida?",
      options: [
        {
          id: "autoestima",
          label: {
            homem: "Minha autoestima e confiança estão afetadas",
            mulher: "Minha autoestima está baixa",
          },
        },
        {
          id: "cansaco",
          label: {
            homem: "Me sinto cansado e sem disposição",
            mulher: "Me sinto cansada e sem disposição",
          },
        },
        {
          id: "saude",
          label: {
            homem: "Tenho preocupação com a saúde (pressão, exames…)",
            mulher: "Tenho exames / pressão alterados",
          },
        },
        {
          id: "corpo",
          label: {
            homem: "Não me sinto bem sem camisa",
            mulher: "Evito certas roupas ou aparecer em fotos",
          },
        },
        {
          id: "melhor",
          label: {
            homem: "Sinto que não estou no meu melhor",
            mulher: "Queria me sentir mais confiante comigo",
          },
        },
      ],
    },
    {
      id: "tentativas",
      type: "single",
      title: "Você já tentou emagrecer antes e não teve o resultado que queria?",
      options: [
        { id: "dieta", label: "Sim, fiz dieta mas a barriga não saiu" },
        { id: "treino", label: "Sim, treinei muito e o resultado foi mínimo" },
        { id: "voltou", label: "Sim, perdi peso mas voltou tudo" },
        { id: "nunca", label: "Nunca segui um método de verdade" },
      ],
    },
    {
      id: "consistencia",
      type: "single",
      title: "Você sente que se esforça mas não vê resultado proporcional?",
      options: [
        { id: "pouco", label: "Sim, faço o que dá e quase não muda" },
        { id: "devagar", label: "Muda, mas muito devagar" },
        { id: "nunca", label: "Nunca consegui ser consistente" },
      ],
    },
    {
      id: "acolhimento",
      type: "info",
      title: "A real: a culpa não é sua.",
      body: "A maioria das dietas falha porque é genérica e não cabe na sua vida. Quando o plano é feito pra VOCÊ, manter deixa de ser sofrimento. É exatamente isso que eu faço.",
      cta: "Continuar",
    },
    {
      id: "peso",
      type: "slider",
      title: "Qual é o seu peso atual?",
      units: [
        { id: "kg", label: "kg", min: 40, max: 200, default: 85, suffix: "kg" },
        { id: "lb", label: "lb", min: 88, max: 440, default: 187, suffix: "lb" },
      ],
    },
    {
      id: "altura",
      type: "slider",
      title: "Qual é a sua altura?",
      units: [
        { id: "cm", label: "cm", min: 140, max: 220, default: 170, suffix: "cm" },
        { id: "pol", label: "pol", min: 55, max: 87, default: 67, suffix: "pol" },
      ],
    },
    {
      id: "caneta",
      type: "single",
      title:
        "Você usa ou já usou alguma caneta emagrecedora (Ozempic, Mounjaro, Wegovy…)?",
      note: "Se usa ou pensa em usar, te oriento como a alimentação potencializa o efeito e protege seu músculo. A dose é sempre com o médico.",
      options: [
        { id: "uso", label: "💉 Uso atualmente" },
        { id: "parei", label: "⏸️ Já usei e parei" },
        { id: "penso", label: "🤔 Penso em usar" },
        { id: "nao", label: "❌ Não uso nem pretendo" },
      ],
    },
    {
      id: "habitos",
      type: "multi",
      title: "Como são seus hábitos hoje?",
      options: [
        { id: "alcool", label: "🍺 Bebo álcool com frequência" },
        { id: "besteira", label: "🍟 Como muita besteira / comida pesada" },
        { id: "parado", label: "📱 Fico muito tempo parado" },
        { id: "sono", label: "😴 Durmo mal / tenho estresse" },
        { id: "pratico", label: "✅ Prefiro praticidade no dia a dia" },
      ],
    },
    {
      id: "meta",
      type: "single",
      title: "Quanto você gostaria de eliminar?",
      options: [
        { id: "0-2", label: "0 a 2 kg" },
        { id: "2-4", label: "2 a 4 kg" },
        { id: "4-6", label: "4 a 6 kg" },
        { id: "6+", label: "6 kg ou mais" },
      ],
    },
    {
      id: "possibilidade",
      type: "info",
      title: "Sua meta é possível com método e constância.",
      body: {
        homem:
          "Já ajudei {n} pessoas a comerem melhor e emagrecerem de forma que se mantém. Você é o próximo.",
        mulher:
          "Já ajudei {n} pessoas a comerem melhor e emagrecerem de forma que se mantém. Você é a próxima.",
      },
      cta: "Continuar teste",
    },
    {
      id: "corpo-desejado",
      type: "single",
      title: "Qual corpo você quer ter?",
      options: [
        {
          id: "definido",
          label: {
            homem: "Definido: sem barriga, com músculo visível",
            mulher: "Definida: barriga lisa e corpo tonificado",
          },
        },
        {
          id: "leve",
          label: { homem: "Mais magro e leve", mulher: "Mais magra e leve" },
        },
        { id: "completa", label: "Transformação completa" },
      ],
    },
    {
      id: "projecao",
      type: "single",
      title: "O que te motiva a mudar agora?",
      options: [
        { id: "confianca", label: "🎯 Voltar a me sentir confiante" },
        { id: "saude", label: "🏥 Cuidar da minha saúde" },
        { id: "roupa", label: "👕 Me sentir bem com qualquer roupa" },
        { id: "melhor", label: "💪 Chegar no meu melhor" },
      ],
    },
    {
      id: "compromisso",
      type: "single",
      title: {
        homem:
          "Você está pronto pra seguir um plano que cabe na sua rotina e fazer ele funcionar?",
        mulher:
          "Você está pronta pra seguir um plano que cabe na sua rotina e fazer ele funcionar?",
      },
      options: [
        { id: "sim", label: "Sim, quero começar" },
        { id: "ajuda", label: "Quero, mas preciso de ajuda pra manter" },
      ],
    },
  ],
};
