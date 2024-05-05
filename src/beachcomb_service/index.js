import express from 'express';
import dotenv from 'dotenv';
import { openWithQueue } from "../common/channel.js";
import { initDb } from '../common/db.js';

// Routes
import { root } from './routes/root.js';
// TODO: route getAllPositions

// Consumers
import { vehicleUpdates } from './consumers/vehicleUpdates.js';


// Load .env file
dotenv.config();

await initDb();

// Run message queue consumers
const channel= await openWithQueue( process.env.CHANNEL_VEHICLE_UPDATES );
channel.consume(process.env.CHANNEL_VEHICLE_UPDATES, vehicleUpdates );


// Run REST API
const app= express();
app.use( express.json() );

app.get('/', root );

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Beachcomb service listening on port ${process.env.REST_PORT}`);
});
