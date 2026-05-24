module.exports = {
  apps: [
    {
      name: 'hkr-landing',
      script: './build/index.js',
      cwd: '/srv/hkr-landing/current',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001'
      }
    }
  ]
};
