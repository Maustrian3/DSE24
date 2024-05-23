import amqplib from 'amqplib';

let channel= null;
export async function ensureChannel() {
  if(channel) {
    return;
  }

  console.log('Connection to RabbitMQ...');
  const {
    MQ_USER: user,
    MQ_PASSWORD: password,
    MQ_HOST_PORT: hostAndPort
  }= process.env;

  const connection= await amqplib.connect( `amqp://${user}:${password}@${hostAndPort}` );
  channel= await connection.createChannel();

  return channel;
}

export async function openWithQueue( queueName, args= {} ) {
  await ensureChannel();

  args= { durable: false, ...args };
  channel.assertQueue(queueName, args);

  return channel;
}

async function openWithExchange( exchangeName, type, args ) {
  await ensureChannel();
  channel.assertExchange(exchangeName, type, args);
  return channel;
}

export async function openWithBroadcastExchange( exchangeName, args= {} ) {
  return openWithExchange(
    exchangeName,
    'fanout',
    { durable: false, ...args }
  );
}


export async function openWithDirectExchange( exchangeName, args= {} ) {
  return openWithExchange(
    exchangeName,
    'direct',
    { durable: false, ...args }
  );
}

export async function openWithBroadcastListener( exchangeName, args= {} ) {
  await openWithBroadcastExchange( exchangeName, args.assertExchange || {} );
  const queue= await channel.assertQueue('', { exclusive: true, ...(args.assertQueue || {}) })

  channel.bindQueue(queue.queue, exchangeName, '');

  return queue; // TODO ask why return the queue here?
}

export async function openWithDirectExchangeListener( exchangeName, args= {} ) {
  await openWithDirectExchange(exchangeName, args.assertExchange || {});
  const queueName = exchangeName + "_queue";
  const queue= await channel.assertQueue(queueName, { exclusive: false, durable: false, ...(args.assertQueue || {}) })

  channel.bindQueue(queue.queue, exchangeName, "");

  return channel;
}

// TODO cleanup
