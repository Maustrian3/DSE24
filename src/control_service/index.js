import dotenv from 'dotenv';
import express from 'express';
import { PromiseMemcached } from './promiseMemcached.js';
import { openWithDirectExchange, openWithBroadcastExchange, openWithQueue, openWithBroadcastListener } from '../common/channel.js';

// Routes
import { root } from './routes/root.js';

// Consumers
import { closeVehiclesMessage } from './consumers/closeVehiclesMessage.js';
import { vehicleLocationMessage } from './consumers/vehicleLocationMessage.js';


dotenv.config();

console.log('Hello world');
const memcached = new PromiseMemcached(process.env.MEMCACHED_HOST_PORT);

// Create message queues
await openWithBroadcastExchange( process.env.CHANNEL_LOGS );
await openWithDirectExchange( process.env.CHANNEL_CONTROL_MESSAGES );

// Run message queue consumers
const channel= await openWithQueue( process.env.CHANNEL_CLOSE_VEHICLES );
channel.consume(
  process.env.CHANNEL_CLOSE_VEHICLES,
  closeVehiclesMessage(channel, memcached),
  {noAck: true}
);

const vehicleQueue= await openWithBroadcastListener( process.env.CHANNEL_VEHICLE_LOCATIONS );
channel.consume(
  vehicleQueue.queue,
  vehicleLocationMessage(channel, memcached),
  {noAck: true}
);

// Run REST API
const app= express();
app.use( express.json() );

const router= express.Router();

router.get('/', root );

app.use('/', router);
app.use(`/${process.env.SERVICE_PREFIX}`, router);

app.listen( parseInt(process.env.REST_PORT), () => {
  const message= `Control service listening on port ${process.env.REST_PORT}`;
  console.log( message );
  channel.publish(
    process.env.CHANNEL_LOGS, '',
    Buffer.from( JSON.stringify({ time: Date.now(), severity: 'info', message, type: 'log', data: null }) )
  );
});
