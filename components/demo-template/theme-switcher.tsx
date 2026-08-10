"use client";

import { useCallback, useEffect, useState } from "react";
import { demoTemplateThemes } from "@/lib/demo-template/defaults";
import type { DemoTemplateKey } from "@/lib/demo-template/types";

const themeKeys = Object.keys(demoTemplateThemes) as DemoTemplateKey[];

type ThemeSwitcherProps = {
  initialTheme: DemoTemplateKey;
  slug: string;
};

export function ThemeSwitcher({ initialTheme, slug }: ThemeSwitcherProps) {
  const [activeTheme, setActiveTheme] = useState<DemoTemplateKey>(initialTheme);
  const [canSave, setCanSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const applyTheme = useCallback((theme: DemoTemplateKey) => {
    const root = document.querySelector(".demo-template");

    if (!root) {
      return;
    }

    for (const key of themeKeys) {
      root.classList.remove(`theme-${key}`);
    }

    root.classList.add(`theme-${theme}`);
    root.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryTheme = params.get("previewTheme");
    const nextTheme = normalizeTheme(queryTheme) || initialTheme;

    applyTheme(nextTheme);
    queueMicrotask(() => setActiveTheme(nextTheme));

    fetch(`/api/sales/demo-pages/theme?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((payload: { canSave?: boolean }) => setCanSave(Boolean(payload.canSave)))
      .catch(() => setCanSave(false));
  }, [applyTheme, initialTheme, slug]);

  function handleThemeChange(theme: DemoTemplateKey) {
    setActiveTheme(theme);
    setStatus("");
    applyTheme(theme);
  }

  async function saveTheme() {
    if (saving) {
      return;
    }

    setSaving(true);
    setStatus("");

    const response = await fetch("/api/sales/demo-pages/theme", {
      body: JSON.stringify({ slug, theme: activeTheme }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    setSaving(false);

    if (!response.ok) {
      setStatus("Theme konnte nicht gespeichert werden.");
      return;
    }

    setStatus("Theme wurde als Standard übernommen.");
  }

  return (
    <aside className="theme-switcher" aria-label="Design-Theme Vorschau">
      <details>
        <summary>
          <span className="theme-switcher-label">Design wechseln</span>
        </summary>
        <div className="theme-switcher-panel">
          <p>Unverbindliche Design-Demo – Theme kann gewechselt werden.</p>
          <div className="theme-option-grid">
            {themeKeys.map((theme) => (
              <button
                aria-pressed={activeTheme === theme}
                className={activeTheme === theme ? "is-active" : ""}
                key={theme}
                type="button"
                onClick={() => handleThemeChange(theme)}
              >
                <span className="theme-swatch-row" aria-hidden="true">
                  <span style={{ background: demoTemplateThemes[theme].primaryColor }} />
                  <span style={{ background: demoTemplateThemes[theme].accentColor }} />
                  <span style={{ background: demoTemplateThemes[theme].secondaryColor }} />
                </span>
                <strong>{demoTemplateThemes[theme].label}</strong>
              </button>
            ))}
          </div>
          {canSave ? (
            <button className="theme-save-button" disabled={saving} type="button" onClick={saveTheme}>
              {saving ? "Wird gespeichert …" : "Als Standard übernehmen"}
            </button>
          ) : null}
          {status ? <p className="theme-status" aria-live="polite">{status}</p> : null}
        </div>
      </details>
    </aside>
  );
}

function normalizeTheme(value: string | null): DemoTemplateKey | null {
  return themeKeys.includes(value as DemoTemplateKey) ? (value as DemoTemplateKey) : null;
}
