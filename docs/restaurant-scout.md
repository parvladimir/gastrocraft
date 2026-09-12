# Restaurant Scout — Secure Integration

## Architecture

```
Grok Bot (Auth user, role=restaurant_scout_bot)
  → POST/GET /api/agent/restaurant-scout/*
  → Zod validation + allowlisted field mapping
  → Supabase user JWT (anon key + session cookies)
  → RLS + SECURITY DEFINER RPCs
  → Postgres
```

The bot **never** receives `service_role`, database passwords, raw SQL admin access, or unrestricted PostgREST write rights. Privileged CRM tables are limited to sales staff via `is_sales_staff()`.

## Manual setup

1. Apply migration `supabase/migrations/20260912_001_restaurant_scout_secure.sql` in the Supabase SQL editor (or CLI).
2. Create a dedicated Auth user (email/password or magic link) for the scout bot. **Do not reuse admin accounts.**
3. Assign the scout role:

```sql
update public.profiles
set role = 'restaurant_scout_bot',
    bot_enabled = true,
    name = 'Restaurant Scout Bot'
where email = 'YOUR_BOT_EMAIL';
```

If the profile row is missing, sign in once as that user (trigger/app) or insert:

```sql
insert into public.profiles (id, name, email, role, bot_enabled)
values ('AUTH_USER_UUID', 'Restaurant Scout Bot', 'YOUR_BOT_EMAIL', 'restaurant_scout_bot', true);
```

4. Configure the bot client with the **same** Supabase URL + anon key as the app, then sign in as the scout user and call only `/api/agent/restaurant-scout/*`.

## Kill switch

Disable all scout writes immediately:

```sql
update public.profiles
set bot_enabled = false
where role = 'restaurant_scout_bot';
```

Re-enable:

```sql
update public.profiles
set bot_enabled = true
where id = 'AUTH_USER_UUID';
```

Admins also see this SQL in **Sales → Mehr → Agent Leads & Runs**.

## API operations

All endpoints require an authenticated scout session.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/agent/restaurant-scout/run/start` | Start a run (`max_leads` capped) |
| POST | `/api/agent/restaurant-scout/duplicate-check` | Minimal duplicate payload via RPC |
| POST | `/api/agent/restaurant-scout/lead` | Create lead (Idempotency-Key supported) |
| POST | `/api/agent/restaurant-scout/lead/[id]/visit-plan` | Mark `visit_status=to_plan` + open visit task (no date/tour) |
| POST | `/api/agent/restaurant-scout/run/[id]/finish` | Finish own running run |
| GET | `/api/agent/restaurant-scout/my-leads` | List own agent leads |
| GET | `/api/agent/restaurant-scout/my-runs` | List own runs |

### Limits (env-overridable)

- `MAX_AGENT_LEADS_PER_RUN` (default 3)
- `MAX_AGENT_LEADS_PER_MINUTE` (default 6)
- `MAX_AGENT_LEADS_PER_DAY` (default 30)
- `MAX_AGENT_RUNS_PER_DAY` (default 20)

### Duplicate logic

Server re-checks duplicates on create via `scout_check_restaurant_duplicate`, returning only:

`{ duplicate, restaurant_id, matched_on, confidence }`

No full restaurant rows are exposed to the scout through that RPC.

### Idempotency

Send `Idempotency-Key` on `POST /lead`. Replays return the stored response. Reusing the same key with a different payload returns `409`.

### Audit

Important actions write to `agent_audit_log` (no secrets). Admins/sales can read the log via RLS.

## Bot permissions

Allowed:

- Start/finish own runs
- Duplicate-check (minimal)
- Create own agent leads under an active run (capped)
- Plan visit as `to_plan` for own lead in active run
- Read own leads/runs/audit rows

Denied:

- `service_role` / DB credentials / arbitrary SQL
- Managing profiles/roles, offers, demos, tours, presentations
- Updating/deleting arbitrary restaurants
- Setting `planned_visit_at`, spoofing `created_by` / `role` / `agent_id`
- Fetching arbitrary URLs from bot input inside this API

## Revoke

1. Set `bot_enabled=false`
2. Disable or delete the Auth user in Supabase Auth
3. Optionally delete/rotate session cookies and change the bot password

## Admin UI

In Sales Manager (**Mehr → Agent Leads & Runs**, admin only):

- Agent Leads table with filters
- Agent Runs list
- Kill-switch SQL helper

Restaurant detail shows an **Agent Discovery** block when `created_by_agent` / `source_type=agent_discovery`.

## Security boundaries

- Client uses anon key only
- API derives identity from session (`auth.getUser()`), never from request body
- Zod `.strict()` rejects unknown fields
- Explicit allowlist mapping — never `insert(request.body)`
- RLS rewritten so broad `auth.uid() is not null` CRM policies become `is_sales_staff()`
- Profile trigger blocks non-admin changes to `role` / `bot_enabled`
