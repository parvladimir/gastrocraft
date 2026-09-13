"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentRun, Restaurant, SalesUser } from "@/lib/sales-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { salesUiLabel } from "@/lib/sales/ui-labels";

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
        Лид, найденный ботом
      </p>
      <h2 className="mt-2 font-heading text-xl font-semibold">Откуда появился лид</h2>
      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <span>Источник: {salesUiLabel(restaurant.source_type || "agent_discovery")}</span>
        <span>Нашёл: {foundBy}</span>
        <span>Оценка лида: {restaurant.lead_score ?? "-"}</span>
        <span>Статус лида: {salesUiLabel(restaurant.lead_status || "-")}</span>
        <span>Статус визита: {salesUiLabel(restaurant.visit_status || "-")}</span>
        <span>Статус сайта: {salesUiLabel(restaurant.website_status || "-")}</span>
        <span>Найден: {formatDate(restaurant.discovered_at)}</span>
        <span>ID запуска: {restaurant.agent_run_id || "-"}</span>
        <span className="sm:col-span-2">
          Источник сведений: {restaurant.source_name || "-"}
          {restaurant.source_url ? (
            <>
              {" · "}
              <a
                className="text-premium-gold underline underline-offset-2"
                href={restaurant.source_url}
                rel="noreferrer"
                target="_blank"
              >
                Ссылка
              </a>
            </>
          ) : null}
        </span>
        {restaurant.selection_reason ? (
          <span className="sm:col-span-2">Почему выбран: {restaurant.selection_reason}</span>
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
      setBotError("Supabase не настроен.");
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
      setBotError(error?.message ?? "Не удалось изменить состояние бота.");
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
      .sort((a, b) => Number(Boolean(b.email)) - Number(Boolean(a.email)) || (b.discovered_at || b.created_at).localeCompare(a.discovered_at || a.created_at));
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
        <h2 className="mt-2 font-heading text-xl font-semibold">Лиды бота</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Доступно только администратору. Бот добавляет лиды через защищённый интерфейс.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Город</span>
            <input
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.city}
              onChange={(event) => setFilter((current) => ({ ...current, city: event.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Статус лида</span>
            <select
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.leadStatus}
              onChange={(event) =>
                setFilter((current) => ({ ...current, leadStatus: event.target.value }))
              }
            >
              <option value="">Все</option>
              <option value="new">Новый</option>
              <option value="qualified">Подходит</option>
              <option value="rejected">Отклонён</option>
              <option value="converted">Конвертирован</option>
              <option value="duplicate">Дубликат</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Статус визита</span>
            <select
              className="min-h-11 rounded border border-white/10 bg-midnight/60 px-3"
              value={filter.visitStatus}
              onChange={(event) =>
                setFilter((current) => ({ ...current, visitStatus: event.target.value }))
              }
            >
              <option value="">Все</option>
              <option value="none">Нет</option>
              <option value="to_plan">Запланировать</option>
              <option value="planned">Запланировано</option>
              <option value="done">Выполнено</option>
              <option value="skipped">Пропущено</option>
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-2 py-2">Заведение</th>
                <th className="px-2 py-2">Город</th>
                <th className="px-2 py-2">Оценка</th>
                <th className="px-2 py-2">Почта</th>
                <th className="px-2 py-2">Сайт</th>
                <th className="px-2 py-2">Источник</th>
                <th className="px-2 py-2">Найден</th>
                <th className="px-2 py-2">Кем</th>
                <th className="px-2 py-2">Визит</th>
                <th className="px-2 py-2">Лид</th>
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
                  <td className="px-2 py-3">{restaurant.email || "-"}</td>
                  <td className="px-2 py-3">
                    {restaurant.website ? (
                      <a
                        className="underline underline-offset-2"
                        href={restaurant.website}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Ссылка
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
                  <td className="px-2 py-3">{salesUiLabel(restaurant.visit_status || "-")}</td>
                  <td className="px-2 py-3">{salesUiLabel(restaurant.lead_status || "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agentLeads.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Лиды бота не найдены.</p>
          ) : null}
        </div>
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Запуски бота</h2>
        {runsError ? <p className="mt-2 text-sm text-red-200">{runsError}</p> : null}
        <div className="mt-4 grid gap-3">
          {runs.map((run) => (
            <div key={run.id} className="rounded border border-white/10 bg-midnight/40 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-warm-white">{run.id.slice(0, 8)}…</span>
                <span className="rounded border border-premium-gold/30 px-2 py-0.5 text-xs text-premium-gold">
                  {salesUiLabel(run.status)}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-slate-300 sm:grid-cols-2">
                <span>Начало: {formatDate(run.started_at)}</span>
                <span>Конец: {formatDate(run.finished_at)}</span>
                <span>
                  Лиды: {run.leads_created}/{run.max_leads}
                </span>
                <span>Город: {run.city || "-"}</span>
              </div>
            </div>
          ))}
          {runs.length === 0 ? <p className="text-sm text-slate-400">Запусков пока нет.</p> : null}
        </div>
      </div>

      <div className={panelClassName}>
        <h2 className="font-heading text-xl font-semibold">Управление доступом бота</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Здесь можно отключить доступ бота или включить его после проверки.
        </p>
        {botError ? <p className="mt-3 text-sm text-red-200">{botError}</p> : null}
        <div className="mt-4 grid gap-3">
          {bots.map((bot) => (
            <div key={bot.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-midnight/40 px-4 py-3">
              <span className="text-sm text-warm-white">
                {bot.name} · {bot.bot_enabled ? "Активен" : "Отключён"}
              </span>
              <button
                className={outlineButtonClassName}
                type="button"
                disabled={updatingBotId === bot.id}
                onClick={() => void setBotEnabled(bot, !bot.bot_enabled)}
              >
                {updatingBotId === bot.id
                  ? "Сохранение…"
                  : bot.bot_enabled
                    ? "Отключить"
                    : "Включить"}
              </button>
            </div>
          ))}
          {bots.length === 0 ? <p className="text-sm text-slate-400">Бот Restaurant Scout не найден.</p> : null}
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
  return date.toLocaleString("ru-RU");
}
