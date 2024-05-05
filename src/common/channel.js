import amqplib from 'amqplib';

let channel= null;
async function ensureChannel() {
  if(channel) {
    return;
  }

  console.log('Connection to RabbitMQ...');
  const connection= await amqplib.connect( 'amqp://' + process.env.MQ_HOST_PORT );
  channel= await connection.createChannel();
}


export async function openWithQueue( queueName, args= {} ) {
  await ensureChannel();

  args= { durable: false, ...args };
  channel.assertQueue(queueName, args);

  return channel;
}

export async function openWithExchange( exchangeName, args= {} ) {
  await ensureChannel();

  args= { durable: false, ...args };
  channel.assertExchange(exchangeName, 'direct', args);

  return channel;
}



