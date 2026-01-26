const http = require('http');
const app = require('./src/app');
const db = require('./models');
const { initializeSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

/**
 * Buat fungsi async untuk memulai server.
 * Ini adalah cara modern dan anti-error untuk menangani startup
 * yang bergantung pada koneksi database.
 */
const startServer = async () => {
  try {
    console.log('🔄 Attempting to connect to the database...');
    // 1. TUNGGU (await) koneksi database selesai DULU
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('🔄 Starting the server...');
    // 2. Create HTTP server
    const server = http.createServer(app);
    
    // 3. Initialize Socket.io
    const io = initializeSocket(server);
    console.log('✅ Socket.io initialized');

    // 4. Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(` API endpoints:`);
      console.log(`   - GET  /health`);
      console.log(`   - POST /api/scans`);
      console.log(`   - GET  /api/scans`);
      console.log(`   - POST /api/targets`);
      console.log(`   - POST /api/ai/explain/:vulnerabilityId`);
      console.log(`   - GET  /api/orders`);
      console.log(`   - GET  /api/chat/conversations`);
      console.log(` Socket.io: ws://localhost:${PORT}`);
    });

  } catch (error) {
    // 3. Jika database GAGAL terhubung, log error dan matikan proses
    console.error('❌ Unable to connect to database:', error);
    console.error('❌ Server startup failed. Exiting process.');
    process.exit(1);
  }
};

// 4. Panggil fungsi untuk memulai server
startServer();