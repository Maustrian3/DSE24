import express from 'express';
import dotenv from 'dotenv';
import amqplib from 'amqplib';

import { initDb } from '../common/db.js';

// Routes
import { root } from './routes/root.js';
// TODO: route getAllPositions


// Load .env file
dotenv.config();

await initDb();

  console.log('Trying to connect to rabbitmq...')

  const connection= await amqplib.connect( 'amqp://' + process.env.MQ_HOST_PORT );
const channel= await connection.createChannel();

channel.assertQueue('hello', {
  durable: false
});

channel.sendToQueue('hello', Buffer.from('Hello sailor'));
console.log('Sent message :^)');



// Run REST API
const app= express();
app.use( express.json() );

app.get('/', root );

app.listen( parseInt(process.env.REST_PORT), () => {
  console.log(`Beachcomb service listening on port ${process.env.REST_PORT}`);
});
