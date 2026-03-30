const { resolve } = require("path");
const { homedir } = require("os");

const AGENTOPS_LOGS = resolve(homedir(), ".agentops", "logs");

module.exports = {
  apps: [
    {
      name: "agentops",
      script: "packages/backend/dist/index.js",
      cwd: __dirname,
      node_args: "--experimental-vm-modules",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Logging
      out_file: resolve(AGENTOPS_LOGS, "agentops-out.log"),
      error_file: resolve(AGENTOPS_LOGS, "agentops-error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policy: max 3 restarts in 60s, then stop
      max_restarts: 3,
      min_uptime: "60s",
      restart_delay: 1000,
      autorestart: true,
      // No file watching — use explicit restart
      watch: false,
      // Graceful shutdown (SIGINT first, then SIGKILL after timeout)
      kill_timeout: 35000, // 35s — allows 30s graceful shutdown + 5s buffer
      listen_timeout: 10000,
    },
  ],
};
