module.exports = {
  apps: [{
    name: 'GLASSGTN-backend-app',
    script: 'dist/src/main.js',
    cwd: '/home/forge/api.glassgtn.ru',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
