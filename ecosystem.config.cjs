module.exports = {
  apps: [{
    name: "optimus-rufus-daemon",
    script: "dist/api/daemon.js",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 5000,
    env: { NODE_ENV: "production" },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    kill_timeout: 10000,
  }]
};
