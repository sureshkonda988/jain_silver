// Keep-alive script to ensure backend stays running
// This will restart the server if it crashes

const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;

const startServer = () => {
  console.log('🚀 Starting backend server...');
  
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`\n⚠️  Server exited with code ${code} and signal ${signal}`);
    console.log('🔄 Restarting server in 3 seconds...\n');
    
    setTimeout(() => {
      startServer();
    }, 3000);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Error starting server:', error);
    setTimeout(() => {
      startServer();
    }, 5000);
  });
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

startServer();

