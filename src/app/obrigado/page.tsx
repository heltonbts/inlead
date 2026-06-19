"use client";

import { useEffect } from "react";
import { CONFIG } from "@/lib/funnel-config";

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

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

export default function ObrigadoPage() {
  const t = CONFIG.thankYou;
  const phone = CONFIG.whatsapp.number.replace(/\D/g, "");
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(t.whatsappMessage)}`;

  // Dispara o evento de conversão no Pixel ao abrir a página de obrigado.
  useEffect(() => {
    track("Purchase", { value: t.purchaseValue, currency: "BRL" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="thanks-bar" role="status">
        {t.bar}
      </div>

      <main className="page-shell">
        <section className="quiz-shell thanks-shell" aria-label={t.title}>
        <div className="step-container">
          <span className="thanks-badge">✔ {t.badge}</span>
          <h1 className="step-title thanks-title">{t.title}</h1>
          <p className="step-subtitle">{t.subtitle}</p>

          <section className="how-block" aria-label={t.stepsTitle}>
            <h2 className="block-title">{t.stepsTitle}</h2>
            <ol className="how-list">
              {t.steps.map((step, index) => (
                <li className="how-item" key={step.title}>
                  <span className="how-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="how-main">
                    <span className="how-title">{step.title}</span>
                    <span className="how-text">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <a
            className="btn-primary thanks-whatsapp"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("Contact", { method: "whatsapp" })}
          >
            <WhatsAppIcon />
            {t.whatsappCta}
          </a>
          <p className="thanks-whatsapp-note">{t.whatsappNote}</p>

          <p className="compliance-footer">{t.footer}</p>
        </div>
        </section>
      </main>
    </>
  );
}
