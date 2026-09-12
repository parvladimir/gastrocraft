import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  "supabase/migrations/20260912_001_restaurant_scout_secure.sql"
);
const sql = readFileSync(migrationPath, "utf8");

describe("restaurant scout RLS migration", () => {
  it("extends role check with restaurant_scout_bot", () => {
    expect(sql).toContain("restaurant_scout_bot");
    expect(sql).toContain("bot_enabled boolean not null default true");
  });

  it("defines helper predicates", () => {
    expect(sql).toContain("create or replace function public.is_sales_staff()");
    expect(sql).toContain("create or replace function public.is_restaurant_scout_bot()");
    expect(sql).toContain("create or replace function public.is_bot_enabled()");
  });

  it("replaces broad authenticated restaurant policies with sales staff", () => {
    expect(sql).toContain('drop policy if exists "Authenticated users can read restaurants"');
    expect(sql).toContain('create policy "Sales staff can read restaurants"');
    expect(sql).toContain("using (public.is_sales_staff())");
  });

  it("keeps scout writes behind checked RPCs", () => {
    expect(sql).not.toContain('create policy "Scout can insert own agent leads"');
    expect(sql).not.toContain('create policy "Scout can create visit tasks for own leads"');
    expect(sql).not.toContain('create policy "Scout can insert own lead history"');
    expect(sql).not.toContain('create policy "Scout can insert own runs"');
    expect(sql).not.toContain('create policy "Scout can finish own running runs"');
    expect(sql).not.toContain('create policy "Scout can insert own audit rows"');
    expect(sql).not.toContain('create policy "Scout can manage own idempotency keys"');
    expect(sql).toContain("create or replace function public.scout_start_run");
    expect(sql).toContain("create or replace function public.scout_finish_run");
    expect(sql).toContain("Daily lead limit exceeded");
  });

  it("closes old broad storage policies", () => {
    expect(sql).toContain('drop policy if exists "Authenticated users can read offer files"');
    expect(sql).toContain('drop policy if exists "Authenticated users can upload demo asset files"');
    expect(sql).toContain('create policy "Sales staff can read private CRM files"');
  });

  it("does not grant scout update/delete on restaurants", () => {
    expect(sql).not.toMatch(/Scout can update restaurants/i);
    expect(sql).not.toMatch(/Scout can delete restaurants/i);
  });

  it("adds minimal duplicate RPC payload", () => {
    expect(sql).toContain("scout_check_restaurant_duplicate");
    expect(sql).toContain("'matched_on'");
    expect(sql).toContain("'confidence'");
  });

  it("adds create_scout_lead and scout_plan_visit security definer RPCs", () => {
    expect(sql).toContain("create or replace function public.create_scout_lead");
    expect(sql).toContain("create or replace function public.scout_plan_visit");
    expect(sql).toContain("visit_status = 'to_plan'");
  });

  it("creates audit and idempotency tables", () => {
    expect(sql).toContain("create table if not exists public.agent_runs");
    expect(sql).toContain("create table if not exists public.agent_audit_log");
    expect(sql).toContain("create table if not exists public.agent_idempotency_keys");
  });

  it("blocks profile privilege escalation", () => {
    expect(sql).toContain("prevent_profile_privilege_escalation");
    expect(sql).toContain("Changing role is not allowed");
  });
});
