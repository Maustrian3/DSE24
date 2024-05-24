import express from 'express';
import dotenv from 'dotenv';
import { openWithBroadcastExchange, openWithQueue } from "../common/channel.js";
import { initDb } from '../common/db.js';

// Routes
import { root } from './routes/root.js';
import { vehiclePositions } from './routes/vehiclePositions.js';

// Consumers
import { vehicleUpdates } from './consumers/vehicleUpdates.js';
import { vehicleAvailability } from './consumers/vehicleAvailability.js';


// Load .env file
dotenv.config();

await initDb();

// Create message queues
await openWithBroadcastExchange( process.env.CHANNEL_VEHICLE_LOCATIONS );
await openWithBroadcastExchange( process.env.CHANNEL_LOGS );
await openWithQueue( process.env.CHANNEL_CLOSE_VEHICLES );

// Run message queue consumers
const channel= await openWithQueue( process.env.CHANNEL_VEHICLE_UPDATES );
channel.consume(
  process.env.CHANNEL_VEHICLE_UPDATES,
  vehicleUpdates( channel )
);

await openWithQueue( process.env.CHANNEL_VEHICLE_AVAILABILITY );
channel.consume(
  process.env.CHANNEL_VEHICLE_AVAILABILITY,
  vehicleAvailability
)


// Run REST API
const app= express();
app.use( express.json() );

const router= express.Router();

router.get('/', root );
router.get('/vehicles/positions', vehiclePositions );

app.use('/', router);
app.use(`/${process.env.SERVICE_PREFIX}`, router);

app.listen( parseInt(process.env.REST_PORT), () => {
  const message= `Beachcomb service listening on port ${process.env.REST_PORT}`;
  console.log( message );
  channel.publish(
    process.env.CHANNEL_LOGS, '',
    Buffer.from( JSON.stringify({ time: Date.now(), severity: 'info', message, type: 'log', data: null }) )
  );
});
