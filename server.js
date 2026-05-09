require('dotenv').config();
const http = require('http');

const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const { startIngestion } = require('./Firmware/mqtt_ingestion_service');
const { startRainfallPoller } = require('./src/services/rainfallPoller');
const {startPredictionService} = require('./src/Services/predictionService');

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  // 1. Connect database
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Wrap in HTTP server
  const httpServer = http.createServer(app);

  // 4. Start background services (MQTT + Rainfall — both write to DB only)
  startIngestion();
  startRainfallPoller();
  startPredictionService();

  // 5. Start listening
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 AFPEWS API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health\n`);
  });

  // 6. Graceful shutdown
  process.on('SIGTERM', () => {``
    console.log('[SERVER] SIGTERM received — shutting down gracefully');
    httpServer.close(() => process.exit(0));
  });
};

bootstrap().catch((err) => {
  console.error('[SERVER] Bootstrap failed:', err.message);
  process.exit(1);
});