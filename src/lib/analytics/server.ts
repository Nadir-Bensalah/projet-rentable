import "server-only";
import { query } from "@/lib/db";
import type { AnalyticsEvent } from "./events";

export interface TrackOptions {
  userId?: string | null;
  anonId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
  props?: Record<string, string | number | boolean | null>;
}

function clip(v: string | null | undefined, n = 200) {
  return v ? v.slice(0, n) : null;
}

/** Stores a first-party analytics event. Never throws: analytics must not break the product. */
export async function trackServer(name: AnalyticsEvent, o: TrackOptions = {}) {
  try {
    await query(
      `INSERT INTO analytics_events (name, anon_id, user_id, path, referrer, utm_source, utm_medium, utm_campaign, props)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        name,
        clip(o.anonId, 64),
        o.userId ?? null,
        clip(o.path),
        clip(o.referrer),
        clip(o.utm?.source, 100),
        clip(o.utm?.medium, 100),
        clip(o.utm?.campaign, 100),
        JSON.stringify(o.props ?? {}),
      ],
    );
  } catch (e) {
    console.error("[analytics] failed to store event", name, e instanceof Error ? e.message : e);
  }
}
