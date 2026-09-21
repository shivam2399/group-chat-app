module.exports = {
  apps: [
    {
      name: "group-chat-app",
      script: "./server/server.js",
      cwd: "./",
      instances: 1, // Optimized for AWS Free Tier (1 vCPU). For multi-core, use Redis adapter with Socket.IO
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "250M", // Memory protection against OOM crashes on 1GB RAM EC2
      kill_timeout: 5000, // Allow 5 seconds for existing WebSocket connections to drain gracefully
      listen_timeout: 8000,
      restart_delay: 2000, // 2-second backoff to prevent CPU thrashing during unexpected errors
      max_restarts: 10,
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};

