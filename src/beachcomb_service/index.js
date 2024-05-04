import express from 'express';
import dotenv from 'dotenv';

import { initDb } from '../common/db.js';

// Routes
import { root } from './routes/root.js';
// TODO: route getAllPositions


// Load .env file
dotenv.config();

await initDb();

// Run REST API
const app= express();
app.use( express.json() );

app.get('/', root );

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Beachcomb service listening on port ${process.env.REST_PORT}`);
});
