import { loadEnv } from "./envLoader.js";
loadEnv();

async function run() {
  const args = process.argv.slice(2);
  let resetName: string | undefined = undefined;

  for (const arg of args) {
    if (arg.startsWith("--reset=")) {
      resetName = arg.split("=")[1];
    }
  }

  const port = process.env.PORT || "3000";
  const healthUrl = `http://127.0.0.1:${port}/health`;
  const resetUrl = `http://127.0.0.1:${port}/api/admin/circuit-breaker/reset`;

  try {
    if (resetName) {
      console.log(`\n⚡ Sending reset request for circuit breaker '${resetName}'...\n`);
      const response = await fetch(resetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resetName }),
      });

      const result = await response.json() as any;
      if (response.ok && result.success) {
        console.log(`✅ Success: ${result.message}\n`);
      } else {
        console.error(`❌ Error: ${result.error || "Failed to reset circuit breaker"}\n`);
        process.exit(1);
      }
    } else {
      console.log(`\n⚡ Querying Circuit Breakers status...\n`);
      const response = await fetch(healthUrl);
      if (!response.ok) {
        throw new Error(`Health check returned HTTP ${response.status}`);
      }
      const data = await response.json() as any;
      const breakers = Object.entries(data.circuitBreakers || {});

      if (breakers.length === 0) {
        console.log("🟢 No circuit breakers have been initialized yet.");
        console.log("   (They are initialized dynamically on first access, e.g., during LLM calls)\n");
        return;
      }

      console.log("Active Circuit Breakers:");
      for (const [name, state] of breakers) {
        const statusEmoji = state === "closed" ? "🟢 CLOSED (OK)" : state === "open" ? "🔴 OPEN (TRIPPED)" : "🟡 HALF-OPEN";
        console.log(`  - ${name}: ${statusEmoji}`);
      }
      console.log(`\n💡 To reset a tripped breaker, run:`);
      console.log(`   node scripts/agent/circuit-breakers.js --reset=<name>\n`);
    }
  } catch (err) {
    console.error(`❌ Error: Could not communicate with running daemon.`, (err as Error).message);
    console.error(`   Make sure the daemon is running on port ${port}.\n`);
  }
}

run();
