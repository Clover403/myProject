const app = require('./src/app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

// Test database connection
db.sequelize
  .authenticate()
  .then(() => {
    console.log(' Database connected successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(` API endpoints:`);
      console.log(`   - GET  /health`);
      console.log(`   - POST /api/scans`);
      console.log(`   - GET  /api/scans`);
      console.log(`   - POST /api/targets`);
      console.log(`   - POST /api/ai/explain/:vulnerabilityId`);
    });
  })
  .catch((error) => {
    console.error(' Unable to connect to database:', error);
    process.exit(1);
  });