export const SCOUT_ROLE = "restaurant_scout_bot" as const;

export const MAX_AGENT_LEADS_PER_RUN = Number(
  process.env.MAX_AGENT_LEADS_PER_RUN ?? "3"
);

export const MAX_AGENT_LEADS_PER_MINUTE = Number(
  process.env.MAX_AGENT_LEADS_PER_MINUTE ?? "6"
);

export const MAX_AGENT_LEADS_PER_DAY = Number(
  process.env.MAX_AGENT_LEADS_PER_DAY ?? "30"
);

export const MAX_AGENT_RUNS_PER_DAY = Number(
  process.env.MAX_AGENT_RUNS_PER_DAY ?? "20"
);

export const MAX_TEXT_SHORT = 200;
export const MAX_TEXT_MEDIUM = 1000;
export const MAX_TEXT_LONG = 2000;
