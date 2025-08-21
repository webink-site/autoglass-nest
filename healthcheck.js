const http = require('http');

const options = {
  host: 'localhost',
  port: 3001,
  path: '/health',
  timeout: 2000,
  method: 'GET'
};

const request = http.request(options, (res) => {
  console.log(`HEALTHCHECK STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('HEALTHCHECK ERROR:', err);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('HEALTHCHECK ERROR: timeout');
  request.destroy();
  process.exit(1);
});

request.end();
