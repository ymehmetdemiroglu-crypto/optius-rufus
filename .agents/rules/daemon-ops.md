## daemon-ops rules

- This repository runs as a headless background daemon, NOT a browser-facing web application.
- There is NO frontend UI served at runtime. Do not attempt to serve HTML files, initialize client-side routes, open browser windows, or reference React/Vite components in any backend execution path.
- All system operations and monitoring must be done via the private CLI scripts located in `scripts/agent/` and PM2 commands.
- The daemon incorporates autonomous self-healing: stuck jobs (>30m active) are auto-requeued to pending, memory warnings are emitted at 80% usage, and circuit breakers auto-recover or can be manually reset.
- Before making database schema, network, or server configuration changes, always run the diagnostics check first:
  `npx tsx scripts/agent/diagnostics.ts`
- After editing any server code inside `api/`, you must compile the TypeScript server code before restarting the daemon:
  `npm run build:daemon`
  `npm run daemon:restart`
- Critical Alert Threshold: If more than 5 jobs fail within a single hour, investigate the failures immediately using `list-jobs.ts --status=failed` and `diagnostics.ts`.
- Always monitor PM2 log outputs immediately after startup or restart to verify clean boot and initialization:
  `npm run daemon:logs`
