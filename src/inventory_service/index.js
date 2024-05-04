
import amqplib from 'amqplib';
import express from 'express';
import dotenv from 'dotenv';
import {Connector} from '@google-cloud/cloud-sql-connector';

import { getConnection, initDb, shutdownDb } from './db.js';

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
  console.log(`Example app listening on port ${process.env.REST_PORT}`);
});

// Do simple test query with connection
const conn = await getConnection();
const [result] = await conn.query(`SELECT NOW();`);
console.table(result); // prints returned time value from server

