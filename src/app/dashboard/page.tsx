import type { Metadata } from "next";
import { CONFIG, pickText, type Gender, type QuizStep } from "@/lib/funnel-config";
import { getSessions, type Session } from "@/lib/db";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Funil",
  robots: { index: false, follow: false },
};

const STEP_LABELS: Record<string, string> = {
  nome: "Nome",
  classificacao: "Classificação",
  objetivo: "Objetivo",
  "corpo-dos-sonhos": "Corpo dos sonhos",
  identificacao: "Identificação",
  impacto: "Impacto",
  tentativas: "Tentativas",
  consistencia: "Consistência",
  caneta: "Caneta (GLP-1)",
  peso: "Peso",
  altura: "Altura",
  habitos: "Hábitos",
  meta: "Meta a eliminar",
  "corpo-desejado": "Corpo desejado",
  projecao: "Motivação",
  compromisso: "Compromisso",
  telefone: "WhatsApp",
};

function sessionGender(session: Session): Gender {
  return session.answers.gender === "mulher" ? "mulher" : "homem";
}

function labelForStep(step: QuizStep): string {
  return STEP_LABELS[step.id] ?? pickText(step.title, "homem");
}

// Converte a resposta crua (id, ids separados por vírgula, ou texto) em algo legível.
function answerDisplay(step: QuizStep, session: Session): string {
  const raw = session.answers[step.id];
  if (!raw) return "";
  const gender = sessionGender(session);

  if (step.type === "single") {
    const option = step.options.find((o) => o.id === raw);
    return option ? pickText(option.label, gender) : raw;
  }
  if (step.type === "multi") {
    const ids = raw.split(",").filter(Boolean);
    return ids
      .map((id) => {
        const option = step.options.find((o) => o.id === id);
        return option ? pickText(option.label, gender) : id;
      })
      .join(", ");
  }
  return raw; // slider / texto
}

function furthestStage(session: Session): {
  label: string;
  kind: "checkout" | "offer" | "step";
} {
  if (session.checkoutClicked) return { label: "Baixou o material", kind: "checkout" };
  if (session.reachedResult) return { label: "Viu o diagnóstico", kind: "offer" };
  const step = CONFIG.steps.find((s) => s.id === session.maxStepId);
  return { label: step ? labelForStep(step) : "Escolheu o caminho", kind: "step" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TZ = "America/Sao_Paulo";

// Data (YYYY-MM-DD) de um ISO no fuso de São Paulo.
function spDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

// Data de hoje (ou com deslocamento de dias) no fuso de São Paulo.
function spToday(offsetDays = 0): string {
  return new Date(Date.now() - offsetDays * 86_400_000).toLocaleDateString(
    "en-CA",
    { timeZone: TZ },
  );
}

function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const isAll = firstParam(sp.range) === "all";
  const onlyCompleted = firstParam(sp.completed) === "1";
  const today = spToday();
  const from = firstParam(sp.from) || today;
  const to = firstParam(sp.to) || today;

  const allSessions = await getSessions();

  // Aplica os filtros: período (por padrão só hoje) e "chegou ao final".
  let sessions = allSessions;
  if (!isAll) {
    sessions = sessions.filter((s) => {
      const d = spDate(s.updatedAt);
      return d >= from && d <= to;
    });
  }
  if (onlyCompleted) {
    sessions = sessions.filter((s) => Boolean(s.name) && Boolean(s.phone));
  }

  const total = sessions.length;

  // Monta querystrings dos atalhos preservando o "somente finalizados".
  const buildHref = (params: Record<string, string>) => {
    const merged = { ...params };
    if (onlyCompleted) merged.completed = "1";
    const qs = new URLSearchParams(merged).toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  const isToday = !isAll && from === today && to === today;
  const isLast7 = !isAll && from === spToday(6) && to === today;

  const periodLabel = isAll
    ? "Todo o período"
    : from === to
      ? formatDayLabel(from)
      : `${formatDayLabel(from)} → ${formatDayLabel(to)}`;

  const reachedResult = sessions.filter((s) => s.reachedResult).length;
  const checkout = sessions.filter((s) => s.checkoutClicked).length;
  const homens = sessions.filter((s) => sessionGender(s) === "homem").length;
  const mulheres = sessions.filter((s) => sessionGender(s) === "mulher").length;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  // Perguntas de escolha (única ou múltipla): base da distribuição de respostas.
  const choiceSteps = CONFIG.steps.filter(
    (s): s is Extract<QuizStep, { type: "single" | "multi" }> =>
      s.type === "single" || s.type === "multi",
  );

  // Etapas mostradas no detalhe de cada pessoa (tudo, menos o nome que vai no topo).
  const detailSteps = CONFIG.steps.filter((s) => s.id !== "nome");

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <main className="dash">
      <div className="dash-head">
        <h1>Dashboard do Funil</h1>
        <span className="dash-sub">
          {CONFIG.brandName} · {periodLabel}
        </span>
      </div>

      <section className="dash-filters">
        <div className="dash-filter-presets">
          <a
            className={`dash-chip ${isToday ? "is-active" : ""}`}
            href={buildHref({})}
          >
            Hoje
          </a>
          <a
            className={`dash-chip ${isLast7 ? "is-active" : ""}`}
            href={buildHref({ from: spToday(6), to: today })}
          >
            Últimos 7 dias
          </a>
          <a
            className={`dash-chip ${isAll ? "is-active" : ""}`}
            href={buildHref({ range: "all" })}
          >
            Tudo
          </a>
        </div>

        <form className="dash-filter-form" method="get" action="/dashboard">
          <label className="dash-field">
            <span>De</span>
            <input type="date" name="from" defaultValue={isAll ? "" : from} />
          </label>
          <label className="dash-field">
            <span>Até</span>
            <input type="date" name="to" defaultValue={isAll ? "" : to} />
          </label>
          <label className="dash-check">
            <input
              type="checkbox"
              name="completed"
              value="1"
              defaultChecked={onlyCompleted}
            />
            <span>Somente quem finalizou (nome + WhatsApp)</span>
          </label>
          <button type="submit">Filtrar</button>
        </form>
      </section>

      {total === 0 ? (
        <div className="dash-empty">
          Nenhuma sessão para este filtro. Ajuste o período ou veja{" "}
          <a href={buildHref({ range: "all" })}>todo o período</a>.
        </div>
      ) : (
        <>
          <section className="dash-kpis">
            <div className="dash-kpi">
              <span className="dash-kpi-label">Entraram no funil</span>
              <span className="dash-kpi-value">{total}</span>
            </div>
            <div className="dash-kpi">
              <span className="dash-kpi-label">Viram o diagnóstico</span>
              <span className="dash-kpi-value">{reachedResult}</span>
              <span className="dash-kpi-extra">{pct(reachedResult)}% dos que entraram</span>
            </div>
            <div className="dash-kpi">
              <span className="dash-kpi-label">Baixaram o material</span>
              <span className="dash-kpi-value">{checkout}</span>
              <span className="dash-kpi-extra">{pct(checkout)}% dos que entraram</span>
            </div>
            <div className="dash-kpi">
              <span className="dash-kpi-label">Homens / Mulheres</span>
              <span className="dash-kpi-value">
                {homens} / {mulheres}
              </span>
            </div>
          </section>

          <h2 className="dash-section-title">Respostas por pergunta</h2>
          <section className="dash-questions">
            {choiceSteps.map((step) => {
              const answered = sessions.filter((s) => s.answers[step.id]).length;
              return (
                <div className="dash-question" key={step.id}>
                  <div className="dash-question-head">
                    <span className="dash-question-title">{pickText(step.title, "homem")}</span>
                    <span className="dash-question-meta">{answered} responderam</span>
                  </div>
                  <div className="dash-funnel">
                    {step.options.map((option) => {
                      // Conta tanto escolha única quanto múltipla (ids separados por vírgula).
                      const count = sessions.filter((s) =>
                        (s.answers[step.id] ?? "").split(",").includes(option.id),
                      ).length;
                      const percent =
                        answered > 0 ? Math.round((count / answered) * 100) : 0;
                      return (
                        <div className="dash-stage" key={option.id}>
                          <span
                            className="dash-stage-fill"
                            style={{ width: `${percent}%` }}
                          />
                          <span className="dash-stage-row">
                            <span className="dash-stage-label">
                              {pickText(option.label, "homem")}
                            </span>
                            <span className="dash-stage-meta">
                              <span className="dash-stage-count">{count}</span> · {percent}%
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

          <h2 className="dash-section-title">Pessoas ({total})</h2>
          <section className="dash-people">
            {sorted.map((session) => {
              const stage = furthestStage(session);
              const gender = sessionGender(session);
              return (
                <article className="dash-person" key={session.id}>
                  <div className="dash-person-head">
                    <div>
                      <span className="dash-person-name">{session.name ?? "Sem nome"}</span>
                      <span className="dash-person-meta">
                        {gender === "mulher" ? "👩 Mulher" : "👨 Homem"}
                        {" · "}
                        {session.phone ?? "sem WhatsApp"}
                        {" · "}
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                    <div className="dash-person-tags">
                      <span className={`dash-badge is-${stage.kind}`}>{stage.label}</span>
                      {session.checkoutClicked ? (
                        <span className="dash-badge is-checkout">Baixou o material</span>
                      ) : null}
                    </div>
                  </div>

                  <dl className="dash-answers">
                    {detailSteps.map((step) => {
                      const value = answerDisplay(step, session);
                      if (!value) return null;
                      return (
                        <div className="dash-answer" key={step.id}>
                          <dt className="dash-answer-q">{labelForStep(step)}</dt>
                          <dd className="dash-answer-a">{value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
