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

export default async function DashboardPage() {
  const sessions = await getSessions();
  const total = sessions.length;

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
          {CONFIG.brandName} · atualiza a cada carregamento
        </span>
      </div>

      {total === 0 ? (
        <div className="dash-empty">
          Ainda não há sessões registradas. Assim que alguém abrir o funil, os dados aparecem aqui.
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
