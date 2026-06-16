"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CONFIG, pickText, type Gender, type QuizStep } from "@/lib/funnel-config";

type Answers = Record<string, string>;
type Phase = "gender" | "quiz" | "loading" | "capture" | "result";
type SubmitState = "idle" | "submitting" | "error";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

function buzz() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12);
  }
}

function fillTokens(text: string, tokens: Record<string, string>) {
  return Object.entries(tokens).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    text,
  );
}

// Resolve o {n} (nº de atendimentos) só com número REAL; sem número vira frase neutra.
function infoBody(text: string) {
  if (!text.includes("{n}")) return text;
  const count = CONFIG.socialProofCount.trim();
  return count
    ? text.replaceAll("{n}", count)
    : text.replaceAll("{n} pessoas", "muita gente");
}

function ArrowLeftIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5m0 0 7 7M5 12l7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m20 6-11 11-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function applyPhoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Strip rotativo de prova social (fotos reais) exibido no rodapé do quiz.
function ProofTicker({ gender }: { gender: Gender }) {
  const images = CONFIG.result.social.images[gender];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="proof-ticker" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={images[index]} className="proof-thumb" src={images[index]} alt="" />
      <span className="proof-caption">Resultado real de aluno</span>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("gender");
  const [gender, setGender] = useState<Gender | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderUnit, setSliderUnit] = useState(0);
  const sessionIdRef = useRef("");

  // Etapas válidas pro gênero escolhido (a etapa "corpo dos sonhos" só aparece pra mulher).
  const steps = useMemo<QuizStep[]>(
    () =>
      gender
        ? CONFIG.steps.filter((s) => !s.onlyFor || s.onlyFor === gender)
        : [],
    [gender],
  );

  function trackEvent(type: string, extra?: Record<string, unknown>) {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, type, ...extra }),
      keepalive: true,
    }).catch(() => {});
  }

  // Cria/recupera o ID da sessão e marca a entrada no funil.
  useEffect(() => {
    let id = sessionStorage.getItem("funnel_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("funnel_sid", id);
    }
    sessionIdRef.current = id;
    trackEvent("start", { stepIndex: -1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps[currentStep];
  const leadName = (answers.nome ?? "").trim();
  const g = gender ?? "homem";

  // Sincroniza o estado do slider quando entra numa etapa de slider.
  useEffect(() => {
    if (phase !== "quiz" || !step || step.type !== "slider") return;
    const existing = answers[step.id];
    if (existing) {
      const [val, suf] = existing.split(" ");
      const unitIdx = Math.max(
        0,
        step.units.findIndex((u) => u.suffix === suf),
      );
      setSliderUnit(unitIdx);
      setSliderValue(Number(val) || step.units[unitIdx].default);
    } else {
      setSliderUnit(0);
      setSliderValue(step.units[0].default);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, phase, gender]);

  // Registra avanço de etapa no dashboard.
  useEffect(() => {
    if (phase === "quiz" && step) {
      trackEvent("step", { stepIndex: currentStep, stepId: step.id, answers });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, phase]);

  // Loading -> captura do WhatsApp.
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => setPhase("capture"), 2600);
    return () => clearTimeout(timer);
  }, [phase]);

  const progress =
    steps.length > 0
      ? Math.round(((currentStep + 1) / steps.length) * 100)
      : 0;

  function startGender(value: Gender) {
    buzz();
    setGender(value);
    setAnswers({ gender: value });
    setCurrentStep(0);
    setPhase("quiz");
    track("StartQuiz", { gender: value });
  }

  function setAnswer(stepId: string, value: string) {
    setAnswers((current) => ({ ...current, [stepId]: value }));
  }

  function advance() {
    setMessage("");
    if (currentStep < steps.length - 1) {
      setCurrentStep((index) => index + 1);
    } else {
      setPhase("loading");
    }
  }

  function goBack() {
    setMessage("");
    if (phase === "capture") {
      setPhase("quiz");
      setCurrentStep(steps.length - 1);
      return;
    }
    if (phase !== "quiz") return;
    if (currentStep === 0) {
      setPhase("gender");
      setGender(null);
      return;
    }
    setCurrentStep((index) => index - 1);
  }

  // Seleção em etapa de escolha única: marca e auto-avança.
  function pickSingle(stepId: string, optionId: string) {
    buzz();
    setAnswer(stepId, optionId);
    setTimeout(() => advance(), 240);
  }

  function toggleMulti(stepId: string, optionId: string) {
    buzz();
    setAnswers((current) => {
      const selected = new Set((current[stepId] ?? "").split(",").filter(Boolean));
      if (selected.has(optionId)) selected.delete(optionId);
      else selected.add(optionId);
      return { ...current, [stepId]: Array.from(selected).join(",") };
    });
  }

  function handleTextNext(event: FormEvent) {
    event.preventDefault();
    if (!step) return;
    if ((answers[step.id] ?? "").trim().length === 0) {
      setMessage(CONFIG.texts.required);
      return;
    }
    advance();
  }

  function handleSliderNext() {
    if (!step || step.type !== "slider") return;
    const unit = step.units[sliderUnit];
    setAnswer(step.id, `${sliderValue} ${unit.suffix}`);
    advance();
  }

  async function submitCapture(event: FormEvent) {
    event.preventDefault();
    const phone = (answers.telefone ?? "").trim();
    if (phone.replace(/\D/g, "").length < 10) {
      setMessage("Confirme seu WhatsApp com DDD para continuar.");
      return;
    }

    setSubmitState("submitting");
    const finalAnswers = { ...answers, telefone: phone };

    try {
      const response = await fetch(CONFIG.leadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: CONFIG.brandName,
          answers: finalAnswers,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Lead request failed");

      track("Lead", { content_name: CONFIG.brandName });
      trackEvent("result", { answers: finalAnswers });
      setSubmitState("idle");
      setPhase("result");
    } catch {
      setSubmitState("error");
      setMessage(CONFIG.texts.errorText);
    }
  }

  // ----- Conteúdo do resultado (diagnóstico personalizado) -----
  const objetivoId = answers.objetivo ?? "";
  const identificacaoId = answers.identificacao ?? "";
  const diagnosisText = CONFIG.result.diagnosisByObjetivo[objetivoId] ?? "";
  const echoText = CONFIG.result.echoByIdentificacao[identificacaoId] ?? "";
  const socialImages = CONFIG.result.social.images[g];

  const showProgress = phase === "quiz";

  return (
    <main className="page-shell">
      <section className="quiz-shell" aria-label={`${CONFIG.brandName} Quiz`}>
        <header className="quiz-header">
          <div className="header-row">
            <button
              className="back-button"
              type="button"
              onClick={goBack}
              disabled={phase === "gender" || phase === "loading" || phase === "result"}
              aria-label={CONFIG.texts.backLabel}
              title={CONFIG.texts.backLabel}
            >
              <ArrowLeftIcon />
            </button>

            <div className="brand" aria-label={CONFIG.brandName}>
              {CONFIG.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="brand-logo" src={CONFIG.logoUrl} alt="" />
              ) : (
                <span className="brand-fallback" aria-hidden="true">
                  {CONFIG.brandName.slice(0, 1)}
                </span>
              )}
              <span>{CONFIG.brandName}</span>
            </div>

            <span aria-hidden="true" />
          </div>

          {showProgress ? (
            <div className="progress-bar" aria-label={`Progresso ${progress}%`}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </header>

        {/* ===== Tela de escolha de gênero ===== */}
        {phase === "gender" ? (
          <div className="step-container">
            <p className="eyebrow">{CONFIG.gender.eyebrow}</p>
            <h1 className="step-title">{CONFIG.gender.title}</h1>
            <p className="step-subtitle">{CONFIG.gender.subtitle}</p>

            <div className="options-grid gender-grid">
              {CONFIG.gender.options.map((option) => (
                <button
                  className="quiz-card gender-card"
                  type="button"
                  key={option.id}
                  onClick={() => startGender(option.id)}
                >
                  <span className="quiz-card-main">
                    <span className="quiz-card-title">{option.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ===== Etapas do quiz ===== */}
        {phase === "quiz" && step ? (
          <div className="step-container" key={`${g}-${step.id}`}>
            <h1 className="step-title">{pickText(step.title, g)}</h1>
            {step.subtitle ? (
              <p className="step-subtitle">{pickText(step.subtitle, g)}</p>
            ) : null}

            {step.type === "single" ? (
              <div className="options-grid" role="radiogroup">
                {step.options.map((option) => {
                  const isActive = answers[step.id] === option.id;
                  return (
                    <button
                      className={`quiz-card${isActive ? " active" : ""}`}
                      type="button"
                      key={option.id}
                      onClick={() => pickSingle(step.id, option.id)}
                      role="radio"
                      aria-checked={isActive}
                    >
                      <span className="quiz-card-main">
                        <span className="quiz-card-title">
                          {pickText(option.label, g)}
                        </span>
                        {option.description ? (
                          <span className="quiz-card-description">
                            {pickText(option.description, g)}
                          </span>
                        ) : null}
                      </span>
                      <span className="quiz-card-indicator">
                        <CheckIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step.type === "multi" ? (
              <>
                <p className="multi-hint">{CONFIG.texts.multiHint}</p>
                <div className="options-grid" role="group">
                  {step.options.map((option) => {
                    const selected = (answers[step.id] ?? "")
                      .split(",")
                      .includes(option.id);
                    return (
                      <button
                        className={`quiz-card${selected ? " active" : ""}`}
                        type="button"
                        key={option.id}
                        onClick={() => toggleMulti(step.id, option.id)}
                        aria-pressed={selected}
                      >
                        <span className="quiz-card-main">
                          <span className="quiz-card-title">
                            {pickText(option.label, g)}
                          </span>
                        </span>
                        <span className="quiz-card-indicator">
                          <CheckIcon />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="actions">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => {
                      if ((answers[step.id] ?? "").length === 0) {
                        setMessage(CONFIG.texts.required);
                        return;
                      }
                      advance();
                    }}
                  >
                    {CONFIG.texts.next}
                  </button>
                </div>
              </>
            ) : null}

            {step.type === "text" || step.type === "phone" ? (
              <form className="form-block" onSubmit={handleTextNext}>
                <input
                  className="form-input"
                  type={step.type === "phone" ? "tel" : "text"}
                  inputMode={step.type === "phone" ? "tel" : "text"}
                  autoComplete={step.type === "phone" ? "tel" : "given-name"}
                  placeholder={step.placeholder}
                  required={step.required}
                  value={answers[step.id] ?? ""}
                  onChange={(event) =>
                    setAnswer(
                      step.id,
                      step.type === "phone"
                        ? applyPhoneMask(event.target.value)
                        : event.target.value,
                    )
                  }
                  autoFocus
                />
                <div className="actions">
                  <button className="btn-primary" type="submit">
                    {CONFIG.texts.next}
                  </button>
                </div>
              </form>
            ) : null}

            {step.type === "slider" ? (
              <div className="slider-block">
                {step.units.length > 1 ? (
                  <div className="unit-toggle" role="group">
                    {step.units.map((unit, index) => (
                      <button
                        type="button"
                        key={unit.id}
                        className={`unit-btn${sliderUnit === index ? " active" : ""}`}
                        onClick={() => {
                          setSliderUnit(index);
                          setSliderValue(step.units[index].default);
                        }}
                      >
                        {unit.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="slider-value">
                  {sliderValue}
                  <span className="slider-suffix">{step.units[sliderUnit].suffix}</span>
                </div>

                <input
                  className="range-input"
                  type="range"
                  min={step.units[sliderUnit].min}
                  max={step.units[sliderUnit].max}
                  value={sliderValue}
                  onChange={(event) => setSliderValue(Number(event.target.value))}
                />
                <div className="range-bounds">
                  <span>{step.units[sliderUnit].min}</span>
                  <span>{step.units[sliderUnit].max}</span>
                </div>

                <div className="actions">
                  <button className="btn-primary" type="button" onClick={handleSliderNext}>
                    {CONFIG.texts.next}
                  </button>
                </div>
              </div>
            ) : null}

            {step.type === "info" ? (
              <div className="info-block">
                <p className="info-body">{infoBody(pickText(step.body, g))}</p>
                <div className="actions">
                  <button className="btn-primary" type="button" onClick={advance}>
                    {pickText(step.cta, g)}
                  </button>
                </div>
                <p className="compliance-footer">{CONFIG.complianceFooter}</p>
              </div>
            ) : null}

            {step.note ? <p className="step-note">{pickText(step.note, g)}</p> : null}
            {message ? <p className="message">{message}</p> : null}

            {gender ? <ProofTicker gender={gender} /> : null}
          </div>
        ) : null}

        {/* ===== Loading ===== */}
        {phase === "loading" ? (
          <div className="step-container loading-screen" role="status">
            <div className="spinner" aria-hidden="true" />
            <h2 className="loading-title">
              {fillTokens(pickText(CONFIG.loading.title, g), { nome: leadName })}
            </h2>
            <ul className="loading-list">
              {CONFIG.loading.items.map((item, index) => (
                <li key={item} style={{ animationDelay: `${index * 0.6}s` }}>
                  <span className="loading-check">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* ===== Captura do WhatsApp ===== */}
        {phase === "capture" ? (
          <div className="step-container">
            <h1 className="step-title">
              {fillTokens(pickText(CONFIG.capture.title, g), { nome: leadName })}
            </h1>
            <p className="step-subtitle">{CONFIG.capture.subtitle}</p>
            <form className="form-block" onSubmit={submitCapture}>
              <input
                className="form-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={CONFIG.capture.placeholder}
                value={answers.telefone ?? ""}
                onChange={(event) =>
                  setAnswer("telefone", applyPhoneMask(event.target.value))
                }
                autoFocus
              />
              <div className="actions">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={submitState === "submitting"}
                >
                  {submitState === "submitting" ? CONFIG.texts.submitting : CONFIG.capture.cta}
                </button>
              </div>
            </form>
            <p className="capture-secure">{CONFIG.capture.secure}</p>
            {message ? <p className="message">{message}</p> : null}
          </div>
        ) : null}

        {/* ===== Resultado / diagnóstico ===== */}
        {phase === "result" ? (
          <div className="step-container result-screen">
            <h1 className="step-title">
              {fillTokens(pickText(CONFIG.result.headline, g), { nome: leadName })}
            </h1>
            <p className="result-subhead">{CONFIG.result.subhead}</p>

            {echoText ? <p className="result-echo">{echoText}</p> : null}

            {diagnosisText ? (
              <div className="diagnosis-card">
                <p>{diagnosisText}</p>
              </div>
            ) : null}

            <section className="closing-block">
              <h2 className="block-title">{CONFIG.result.closingTitle}</h2>
              <ul className="closing-list">
                {CONFIG.result.closingBullets.map((bullet) => (
                  <li key={pickText(bullet, g)}>{pickText(bullet, g)}</li>
                ))}
              </ul>
              <p className="closing-note">{CONFIG.result.closingNote}</p>
            </section>

            <section className="how-block" aria-label={CONFIG.result.howItWorks.title}>
              <h2 className="block-title">{CONFIG.result.howItWorks.title}</h2>
              <ol className="how-list">
                {CONFIG.result.howItWorks.steps.map((hstep, index) => (
                  <li className="how-item" key={hstep.title}>
                    <span className="how-num" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="how-main">
                      <span className="how-title">{hstep.title}</span>
                      <span className="how-text">{hstep.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="social-proof" aria-label={CONFIG.result.social.title}>
              <h2 className="social-title">{CONFIG.result.social.title}</h2>
              <p className="social-subtitle">{CONFIG.result.social.subtitle}</p>
              <div className="social-track">
                {socialImages.map((src) => (
                  <figure className="social-item" key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="social-img" src={src} alt="Resultado real de aluno" loading="lazy" />
                  </figure>
                ))}
              </div>
              <p className="social-disclaimer">{CONFIG.result.social.disclaimer}</p>
            </section>

            <section className="offer-block" aria-label={CONFIG.result.offer.title}>
              <h2 className="block-title">{CONFIG.result.offer.title}</h2>
              <p className="offer-subtitle">{CONFIG.result.offer.subtitle}</p>
              <ul className="offer-includes">
                {CONFIG.result.offer.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="offer-guarantee">
                <span className="offer-guarantee-title">
                  🛡️ {CONFIG.result.offer.guaranteeTitle}
                </span>
                <span className="offer-guarantee-text">{CONFIG.result.offer.guarantee}</span>
              </div>
              <p className="offer-scarcity">⚠️ {CONFIG.result.offer.scarcity}</p>
            </section>

            {CONFIG.checkoutUrl ? (
              <a
                className="btn-primary cta-final"
                href={CONFIG.checkoutUrl}
                onClick={() => {
                  track("InitiateCheckout");
                  trackEvent("checkout");
                }}
              >
                {CONFIG.result.cta}
              </a>
            ) : null}
            <p className="cta-note">{CONFIG.result.ctaNote}</p>

            <p className="compliance-footer">{CONFIG.complianceFooter}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
