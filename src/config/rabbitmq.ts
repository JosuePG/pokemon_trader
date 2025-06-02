import amqplib from 'amqplib';

let channel: amqplib.Channel;
export const QUEUE_NAME = 'tradeQueue';

export const connectRabbitMQ = async () => {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME);
};

export const getChannel = () => channel;