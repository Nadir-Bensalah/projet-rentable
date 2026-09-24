/**
 * Product analytics event catalogue (shared by client and server).
 * Events never contain statement content: no labels, no amounts, no file names.
 */
export const CLIENT_EVENTS = [
  "page_view",
  "cta_click",
  "file_selected",
  "parse_succeeded",
  "parse_failed",
  "export_clicked",
  "export_completed",
  "paywall_shown",
  "pricing_viewed",
  "checkout_clicked",
  "signup_started",
  "layout_report_sent",
  "free_tool_used",
] as const;

export const SERVER_EVENTS = [
  "signup_completed",
  "email_verified",
  "login",
  "export_charged",
  "checkout_started",
  "purchase_completed",
  "subscription_started",
  "subscription_canceled",
  "payment_succeeded",
  "payment_failed",
  "account_deleted",
  "referral_rewarded",
] as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type ServerEvent = (typeof SERVER_EVENTS)[number];
export type AnalyticsEvent = ClientEvent | ServerEvent;

export function isClientEvent(name: string): name is ClientEvent {
  return (CLIENT_EVENTS as readonly string[]).includes(name);
}
