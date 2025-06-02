import { Trade } from '../models/Trade';
import { connectRabbitMQ, getChannel, QUEUE_NAME } from '../config/rabbitmq';

export const startTradeWorker = async () => {
  await connectRabbitMQ();
  const channel = getChannel();

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg) {
      const { tradeId } = JSON.parse(msg.content.toString());
      const trade = await Trade.findById(tradeId);

      if (trade && trade.status === 'pending') {
        console.log(`Processing trade: ${trade._id}`);
        // Future logic: auto validate, notify, etc.
        // For now, just acknowledge
      }

      channel.ack(msg);
    }
  });
};