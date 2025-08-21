#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Production startup script for Railway deployment
// Starts both Next.js frontend and Express API server

const isDev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const apiPort = process.env.API_PORT || 3001;

console.log(`🚀 Starting Market Cap Tracker in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`📊 Frontend will be available on port ${port}`);
console.log(`🔌 API will be available on port ${apiPort}`);

// Start API server
const apiServer = spawn('node', ['api/server.js'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT: apiPort,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

// Start Next.js server
const nextServer = spawn('npx', ['next', 'start', '-p', port], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  apiServer.kill('SIGTERM');
  nextServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  apiServer.kill('SIGINT');
  nextServer.kill('SIGINT');
});

// Handle server exits
apiServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ API server exited with code ${code}`);
  }
});

nextServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Next.js server exited with code ${code}`);
  }
});

console.log('✅ Both servers started successfully!');