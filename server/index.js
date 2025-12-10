/**
 * KAMAYAN POS Print Server - Production Ready
 * A standalone server that can be hosted on any platform
 */

// Load environment variables from .env file if it exists
require('dotenv').config();

const express = require('express');
const net = require('net');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Print server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'KAMAYAN POS Print Server',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      info: '/api/info',
      print: '/api/print'
    }
  });
});

// Print endpoint
app.post('/api/print', async (req, res) => {
  const { ip, port, data } = req.body;
  
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 📄 Print request received`);
  console.log(`   Printer: ${ip}:${port || 9100}`);
  console.log(`   Data size: ${data ? data.length : 0} bytes`);
  
  // Validation
  if (!ip || !data || !Array.isArray(data)) {
    console.error('❌ Invalid request: IP and data array required');
    return res.status(400).json({ 
      success: false,
      error: 'Invalid request', 
      message: 'IP address and data array are required' 
    });
  }

  // Validate IP format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid IP address format'
    });
  }

  const printerPort = port || 9100;
  
  // Validate port range
  if (printerPort < 1 || printerPort > 65535) {
    return res.status(400).json({
      success: false,
      error: 'Invalid port number (must be 1-65535)'
    });
  }

  let buffer;
  try {
    // Convert data array to buffer
    buffer = Buffer.from(data);
    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Print data is empty'
      });
    }
  } catch (error) {
    console.error('❌ Error creating buffer:', error);
    return res.status(400).json({
      success: false,
      error: `Invalid data format: ${error.message}`
    });
  }
  
  console.log(`🔌 Connecting to printer ${ip}:${printerPort}...`);
  
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let connected = false;
    let printSuccess = false;
    let resolved = false;
    
    // Connection timeout (10 seconds)
    socket.setTimeout(10000);
    
    const resolveOnce = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    
    socket.on('timeout', () => {
      console.error('❌ Connection timeout');
      socket.destroy();
      resolveOnce({
        success: false,
        error: 'Connection timeout - printer may be offline or unreachable'
      });
    });
    
    socket.on('error', (error) => {
      console.error(`❌ Connection error: ${error.message}`);
      resolveOnce({
        success: false,
        error: error.message || 'Connection failed'
      });
    });
    
    socket.on('connect', () => {
      connected = true;
      console.log(`✅ Connected to printer`);
      console.log(`📤 Sending ${buffer.length} bytes...`);
      
      try {
        socket.write(buffer);
        socket.end();
        printSuccess = true;
      } catch (error) {
        console.error(`❌ Error sending data: ${error.message}`);
        socket.destroy();
        resolveOnce({
          success: false,
          error: `Failed to send data: ${error.message}`
        });
      }
    });
    
    socket.on('close', () => {
      if (connected && printSuccess) {
        console.log(`✅ Print job completed successfully\n`);
        resolveOnce({
          success: true,
          message: 'Print job sent successfully'
        });
      } else if (!connected && !resolved) {
        console.log(`❌ Connection closed before completion\n`);
        resolveOnce({
          success: false,
          error: 'Connection closed unexpectedly'
        });
      }
    });
    
    // Connect to printer
    try {
      socket.connect(printerPort, ip);
    } catch (error) {
      console.error(`❌ Error initiating connection: ${error.message}`);
      resolveOnce({
        success: false,
        error: `Failed to connect: ${error.message}`
      });
    }
  })
  .then((result) => {
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/health', '/api/info', '/api/print']
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🖨️  KAMAYAN POS Print Server');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 Print endpoint: http://localhost:${PORT}/api/print`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`ℹ️  API info: http://localhost:${PORT}/api/info`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\nWaiting for print jobs...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n\n👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n\n👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

