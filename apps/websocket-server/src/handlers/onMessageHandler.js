const SubscriptionManager = require('../managers/SubscriptionManager');
const config = require('../config');
const amqp = require('amqplib');
let channelPromise = null;

async function getAmqpChannel() {
  if (!channelPromise) {
    channelPromise = amqp
      .connect(config.rabbitMQ.url)
      .then((conn) => conn.createChannel())
      .then(async (ch) => {
        await ch.assertExchange(
          config.rabbitMQ.exchangeName,
          config.rabbitMQ.exchangeType,
          { durable: false },
        );
        return ch;
      })
      .catch((err) => {
        console.error('[AMQP] publish channel error', err.message);
        channelPromise = null;
        throw err;
      });
  }
  return channelPromise;
}

async function handleBroadcast(ws, payload) {
  const { channel, event, data: eventData } = payload;
  const isAdmin = ws.user.role === 'admin' || ws.user.role === 'super-admin';
  const isUserTarget = channel === `user.${ws.user.id}`;
  const isPublic = channel.startsWith('public.');
  const isChat = channel.startsWith('chat.');

  if (!(isAdmin || isPublic || isUserTarget || isChat)) {
    console.warn(
      `AuthZ failed: User ${ws.user.id} cannot broadcast to ${channel}`,
    );
    return;
  }

  const content = {
    channel,
    event,
    data: eventData,
    sender: { id: ws.user.id, email: ws.user.email, role: ws.user.role },
    timestamp: new Date().toISOString(),
  };

  const ch = await getAmqpChannel();
  ch.publish(
    config.rabbitMQ.exchangeName,
    channel,
    Buffer.from(JSON.stringify(content)),
  );
}

module.exports = function onMessageHandler(ws, message) {
  try {
    const data = JSON.parse(message);
    const { type, payload } = data;

    switch (type) {
      case 'subscribe': {
        const { channel } = payload;
        const isAdmin =
          ws.user.role === 'admin' || ws.user.role === 'super-admin';
        const userChannel = `user.${ws.user.id}`;
        const userChatChannel = `chat.${ws.user.id}`;
        const allowed =
          channel === userChannel ||
          channel === userChatChannel ||
          channel.startsWith('public.') ||
          (isAdmin &&
            (channel.startsWith('chat.') || channel.startsWith('user.')));

        if (allowed) {
          SubscriptionManager.subscribe(ws, channel);
        } else {
          console.warn(
            `AuthZ failed: User ${ws.user.id} tried to access ${channel}`,
          );
        }
        break;
      }

      case 'unsubscribe': {
        const { channel } = payload;
        SubscriptionManager.unsubscribe(ws, channel);
        break;
      }

      case 'broadcast':
        handleBroadcast(ws, payload);
        break;

      default:
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
};
