export type FaqItem = {
  answer: string;
  id: string;
  question: string;
};

export const faqItems: FaqItem[] = [
  {
    answer:
      "Je nach Umfang meist zwischen wenigen Tagen und wenigen Wochen. Vor Projektbeginn erhalten Sie eine klare Einschätzung.",
    id: "project-duration",
    question: "Wie lange dauert ein Projekt?"
  },
  {
    answer:
      "Ja. Je nach Lösung können Inhalte einfach aktualisiert werden oder wir übernehmen die Pflege für Sie.",
    id: "menu-updates",
    question: "Kann ich meine Speisekarte später selbst ändern?"
  },
  {
    answer:
      "In den meisten Fällen ja. Wir unterstützen Sie beim Umzug oder der Anbindung.",
    id: "existing-domain",
    question: "Kann meine bestehende Domain weiter genutzt werden?"
  },
  {
    answer:
      "Ja. Alle Projekte werden konsequent für mobile Geräte entwickelt.",
    id: "mobile-optimized",
    question: "Ist die Website auch für Smartphones optimiert?"
  },
  {
    answer:
      "Das hängt vom gewünschten Umfang ab. Deshalb bieten wir zunächst eine kostenlose und unverbindliche Erstberatung an.",
    id: "website-cost",
    question: "Was kostet eine Website?"
  },
  {
    answer:
      "Ja. Die meisten Projekte lassen sich jederzeit erweitern.",
    id: "future-features",
    question: "Kann ich später weitere Funktionen ergänzen?"
  }
];
