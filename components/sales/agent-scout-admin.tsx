"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentRun, Restaurant, SalesUser } from "@/lib/sales-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const panelClassName =
  "rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]";
const outlineButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded border border-premium-gold/35 px-4 text-sm font-semibold text-premium-gold transition-colors hover:bg-premium-gold/10";

type LeadFilter = {
  city: string;
  leadStatus: string;
  visitStatus: string;
};

type ScoutBot = {
  id: string;
  name: string;
  bot_enabled: boolean;
};

export function AgentDiscoveryBlock({
  restaurant,
  users
}: {
  restaurant: Restaurant;
  users: SalesUser[];
}) {
  if (!restaurant.created_by_agent && restaurant.source_type !== "agent_discovery") {
    return null;
  }

  const foundBy =
    users.find((user) => user.id === restaurant.created_by)?.name ||
    restaurant.created_by ||
    "Scout Bot";

  return (
    <div className={`${panelClassName} mt-5`}>
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
        Agent Discovery
      </p>
      <h2 className="mt-2 font-heading text-xl font-semibold">Scout-Herkunft</h2>
      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <span>Quelle: {restaurant.source_type || "agent_discovery"}</span>
        <span>Gefunden von: {foundBy}</span>
        <span>Lead-Score: {restaurant.lead_score ?? "-"}</span>
        <span>Lead-Status: {restaurant.lead_status || "-"}</span>
        <span>Visit-Status: {restaurant.visit_status || "-"}</span>
        <span>Website-Status: {restaurant.website_status || "-"}</span>
        <span>Gefunden am: {formatDate(restaurant.discovered_at)}</span>
        <span>Run-ID: {restaurant.agent_run_id || "-"}</span>
        <span className="sm:col-span-2">
          Source: {restaurant.source_name || "-"}
          {restaurant.source_url ? (
            <>
              {" · "}
              <a
                className="text-premium-gold underline underline-offset-2"
                href={restaurant.source_url}
                rel="noreferrer"
                target="_blank"
              >
                Link
              </a>
            </>
          ) : null}
        </span>
        {restaurant.selection_reason ? (
          <span className="sm:col-span-2">Begründung: {restaurant.selection_reason}</span>
        ) : null}
      </div>
    </div>
  );
}

export function AgentScoutAdminPanel({
  currentUser,
  onOpenRestaurant,
  restaurants,
  users
}: {
  currentUser: SalesUser;
  onOpenRestaurant: (id: string) => void;
  restaurants: Restaurant[];
  users: SalesUser[];
}) {
  const [filter, setFilter] = useState<LeadFilter>({
    city: "",
    leadStatus: "",
    visitStatus: ""
  });
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [runsError, setRunsError] = useState("");
  const [bots, setBots] = useState<ScoutBot[]>([]);
  const [botError, setBotError] = useState("");
  const [updatingBotId, setUpdatingBotId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.role !== "admin") {
      return;
    }

    let cancelled = false;
    async function loadRuns() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        return;
      }
      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(30);
      if (cancelled) {
        return;
      }
      if (error) {
        setRunsError(error.message);
        return;
      }
      setRuns((data ?? []) as AgentRun[]);
    }

    void loadRuns();
    async function loadBots() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, bot_enabled")
        .eq("role", "restaurant_scout_bot")
        .order("name");
      if (cancelled) {
        return;
      }
      if (error) {
        setBotError(error.message);
        return;
      }
      setBots((data ?? []) as ScoutBot[]);
    }
    void loadBots();
    return () => {
      cancelled = true;
    };
  }, [currentUser.role]);

  async function setBotEnabled(bot: ScoutBot, enabled: boolean) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBotError("Supabase ist nicht konfiguriert.");
      return;
    }
    setBotError("");
    setUpdatingBotId(bot.id);
    const { data, error } = await supabase
      .from("profiles")
      .update({ bot_enabled: enabled })
      .eq("id", bot.id)
      .eq("role", "restaurant_scout_bot")
      .select("id, bot_enabled")
      .single();
    setUpdatingBotId(null);
    if (error || !data) {
      setBotError(error?.message ?? "Bot-Status konnte nicht geändert werden.");
      return;
    }
    setBots((current) =>
      current.map((item) =>
        item.id === bot.id ? { ...item, bot_enabled: data.bot_enabled } : item
      )
    );
  }

  const agentLeads = useMemo(() => {
    return restaurants
      .filter((restaurant) => restaurant.created_by_agent || restaurant.source_type === "agent_discovery")
      .filter((restaurant) => {
        if (filter.city && !restaurant.city.toLowerCase().includes(filter.city.toLowerCase())) {
          return false;
        }
        if (filter.leadStatus && restaurant.lead_status !== filter.leadStatus) {
          return false;
        }
        if (filter.visitStatus && restaurant.visit_status !== filter.visitStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.discovered_at || b.created_at).localeCompare(a.discovered_at || a.created_at));
  }, [filter, restaurants]);

  if (currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="grid gap-5">
      <div className={panelClassName}>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          Restaurant Scout
        </p>
        <h2 className="mt-2 font-heading text-xl font-semibold">Agent Leads</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Nur für Admins sichtbar. Bot schreibt ausschließlich über die gesicherte Agent-API.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Stadt</span>
            <input
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.city}
              onChange={(event) => setFilter((current) => ({ ...current, city: event.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Lead-Status</span>
            <select
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.leadStatus}
              onChange={(event) =>
                setFilter((current) => ({ ...current, leadStatus: event.target.value }))
              }
            >
              <option value="">Alle</option>
              <option value="new">new</option>
              <option value="qualified">qualified</option>
              <option value="rejected">rejected</option>
              <option value="converted">converted</option>
              <option value="duplicate">duplicate</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Visit-Status</span>
            <select
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.visitStatus}
              onChange={(event) =>
                setFilter((current) => ({ ...current, visitStatus: event.target.value }))
              }
            >
              <option value="">Alle</option>
              <option value="none">none</option>
              <option value="to_plan">to_plan</option>
              <option value="planned">planned</option>
              <option value="done">done</option>
              <option value="skipped">skipped</option>
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-2 py-2">Restaurant</th>
                <th className="px-2 py-2">Stadt</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Website</th>
                <th className="px-2 py-2">Quelle</th>
                <th className="px-2 py-2">Gefunden</th>
                <th className="px-2 py-2">Von</th>
                <th className="px-2 py-2">Visit</th>
                <th className="px-2 py-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {agentLeads.map((restaurant) => (
                <tr key={restaurant.id} className="border-t border-white/10">
                  <td className="px-2 py-3">
                    <button
                      className="font-semibold text-premium-gold"
                      type="button"
                      onClick={() => onOpenRestaurant(restaurant.id)}
                    >
                      {restaurant.name}
                    </button>
                  </td>
                  <td className="px-2 py-3">{restaurant.city || "-"}</td>
                  <td className="px-2 py-3">{restaurant.lead_score ?? "-"}</td>
                  <td className="px-2 py-3">
                    {restaurant.website ? (
                      <a
                        className="underline underline-offset-2"
                        href={restaurant.website}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-2 py-3">{restaurant.source_name || restaurant.source_type || "-"}</td>
                  <td className="px-2 py-3">{formatDate(restaurant.discovered_at || restaurant.created_at)}</td>
                  <td className="px-2 py-3">
                    {users.find((user) => user.id === restaurant.created_by)?.name || "Bot"}
                  </td>
                  <td className="px-2 py-3">{restaurant.visit_status || "-"}</td>
                  <td className="px-2 py-3">{restaurant.lead_status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agentLeads.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Keine Agent-Leads gefunden.</p>
          ) : null}
        </div>
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Agent Runs</h2>
        {runsError ? <p className="mt-2 text-sm text-red-200">{runsError}</p> : null}
        <div className="mt-4 grid gap-3">
          {runs.map((run) => (
            <div key={run.id} className="rounded border border-white/10 bg-midnight/40 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-warm-white">{run.id.slice(0, 8)}…</span>
                <span className="rounded border border-premium-gold/30 px-2 py-0.5 text-xs text-premium-gold">
                  {run.status}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-slate-300 sm:grid-cols-2">
                <span>Start: {formatDate(run.started_at)}</span>
                <span>Ende: {formatDate(run.finished_at)}</span>
                <span>
                  Leads: {run.leads_created}/{run.max_leads}
                </span>
                <span>Stadt: {run.city || "-"}</span>
              </div>
            </div>
          ))}
          {runs.length === 0 ? <p className="text-sm text-slate-400">Noch keine Runs.</p> : null}
        </div>
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Kill Switch</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Scout-Zugriff sofort deaktivieren oder nach einer Prüfung wieder aktivieren.
        </p>
        {botError ? <p className="mt-3 text-sm text-red-200">{botError}</p> : null}
        <div className="mt-4 grid gap-3">
          {bots.map((bot) => (
            <div key={bot.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-midnight/40 px-4 py-3">
              <span className="text-sm text-warm-white">
                {bot.name} · {bot.bot_enabled ? "Aktiv" : "Deaktiviert"}
              </span>
              <button
                className={outlineButtonClassName}
                type="button"
                disabled={updatingBotId === bot.id}
                onClick={() => void setBotEnabled(bot, !bot.bot_enabled)}
              >
                {updatingBotId === bot.id
                  ? "Speichern…"
                  : bot.bot_enabled
                    ? "Deaktivieren"
                    : "Aktivieren"}
              </button>
            </div>
          ))}
          {bots.length === 0 ? <p className="text-sm text-slate-400">Kein Scout-Bot vorhanden.</p> : null}
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("de-DE");
}
