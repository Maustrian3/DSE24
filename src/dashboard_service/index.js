import express from 'express';
import dotenv from 'dotenv';
import BetterSSE from 'better-sse';
import { initDb } from '../common/db.js';
import { openWithBroadcastListener, ensureChannel } from '../common/channel.js';

// Routes
import { logs } from './routes/logs.js';
import { logEvents } from './routes/logEvents.js';
import { map } from './routes/map.js';
import { vehicles } from './routes/vehicles.js';
import { vehicleEvents } from './routes/vehicleEvents.js';

// Consumers
import { logMessage } from './consumers/logMessage.js';
import { vehicleLocationMessage } from './consumers/vehicleLocationMessage.js';

dotenv.config();

await initDb();

// Create sse broadcast channel
const sseLogChannel= BetterSSE.createChannel();
const sseVehicleChannel= BetterSSE.createChannel();

// Run message queue consumers
const channel = await ensureChannel();

const logQueue= await openWithBroadcastListener( process.env.CHANNEL_LOGS );
channel.consume(
  logQueue.queue,
  logMessage( sseLogChannel )
);

const vehicleQueue= await openWithBroadcastListener( process.env.CHANNEL_VEHICLE_LOCATIONS );
channel.consume(
  vehicleQueue.queue,
  vehicleLocationMessage( sseVehicleChannel )
);

// Run REST API
const app = express();
app.use( express.json() );

const router= express.Router();
router.use( express.static('./public') );

router.get('/logs', logs );
router.get('/logs/live', logEvents( sseLogChannel ) );
router.get('/map', map);
router.get('/vehicles', vehicles);
router.get('/vehicles/live', vehicleEvents( sseVehicleChannel ) );

app.use('/', router);
app.use(`/${process.env.SERVICE_PREFIX}`, router);

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Dashboard service listening on port ${process.env.REST_PORT}`);
});
