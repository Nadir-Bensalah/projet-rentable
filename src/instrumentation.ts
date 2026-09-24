/**
 * Runs once when the server starts. In production, a missing or unsafe configuration
 * stops the process instead of serving a half-working site (marketing pages up, APIs
 * failing). Skipped during `next build`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertConfigurationOrExit } = await import("./instrumentation-node");
    await assertConfigurationOrExit();
  }
}
