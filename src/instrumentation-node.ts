/** Node.js-only part of the startup check (see instrumentation.ts). */
export async function assertConfigurationOrExit() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { configurationProblems } = await import("./lib/env");
  const problems = configurationProblems();
  if (problems.length) {
    console.error("[relevéo] Refusing to start, production configuration incomplete:\n- " + problems.join("\n- "));
    process.exit(1);
  }
}
