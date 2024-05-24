import amqplib from 'amqplib';

let channel= null;
export async function ensureChannel() {
  if(channel) {
    return;
  }

  console.log('Connecting to RabbitMQ...');
  const {
    MQ_USER: user,
    MQ_PASSWORD: password,
    MQ_HOST_PORT: hostAndPort
  }= process.env;

  let connection= null;

  const attempts= Math.max( 1, parseInt(process.env.MQ_CONNECT_ATTEMPTS) ) || 3;
  for( let i= 0; i< attempts; i++ ) {
    try {
      connection= await amqplib.connect( `amqp://${user}:${password}@${hostAndPort}` );

    } catch( e ) {
      console.log('Could not connect to RabbitMQ:', e.code || e.name);
      if( i < attempts-1 ) {
        console.log(`Retrying... (attempt ${i+1}/${attempts})`)
        continue;
      }

      throw e;
    }
  }

  channel= await connection.createChannel();
  return channel;
}

export async function openWithQueue( queueName, args= {} ) {
  await ensureChannel();

  args= { durable: false, ...args };
  await channel.assertQueue(queueName, args);

  return channel;
}

async function openWithExchange( exchangeName, type, args ) {
  await ensureChannel();
  await channel.assertExchange(exchangeName, type, args);
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
  const queue= await channel.assertQueue('', { exclusive: true, ...(args.assertQueue || {}) });

  channel.bindQueue(queue.queue, exchangeName, '');

  return queue;
}
