
import amqplib from 'amqplib';
import express from 'express';
import dotenv from 'dotenv';

import { initDb } from './db.js';

// Routes
import { root } from './routes/root.js';
import { createVehicle } from './routes/createVehicle.js';
import { getChannelId } from './routes/getChannelId.js';



// Load .env file
dotenv.config();

await initDb();

// Run REST API
const app= express();
app.use( express.json() );

app.get('/', root );
app.get('/vehicles/:vin/channel', getChannelId );
app.post('/vehicles', createVehicle );

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Inventory service listening on port ${process.env.REST_PORT}`);
});
