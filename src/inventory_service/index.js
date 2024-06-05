import express from 'express';
import dotenv from 'dotenv';

import {initDb} from '../common/db.js';

// Routes
import {root} from './routes/root.js';
import {createVehicle} from './routes/createVehicle.js';
import {getChannelId} from './routes/getChannelId.js';
import {getKind} from './routes/getKind.js';

export var app;

var server;

createApp();

export async function createApp() {
  // Load .env file
  dotenv.config();

  await initDb();

  // Run REST API
  app = express();
  app.use(express.json());

  const router = express.Router();

  router.get('/', root);
  router.get('/vehicles/:vin/channel', getChannelId);
  router.get('/vehicles/:vin/kind', getKind);
  router.post('/vehicles', createVehicle);

  app.use('/', router);
  app.use(`/${process.env.SERVICE_PREFIX}`, router);
  startServer();
}


export function startServer() {

    server = app.listen(parseInt(process.env.REST_PORT), () => {
      console.log(`Inventory service listening on port ${process.env.REST_PORT}`);
    });
}


export function closeServer() {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        return reject(err);
      }
      console.log('Server closed');
      resolve();
    });
  });
}