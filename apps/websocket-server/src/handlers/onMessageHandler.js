const SubscriptionManager = require('../managers/SubscriptionManager');

module.exports = function onMessageHandler(ws, message) {
  try {
    const data = JSON.parse(message);
    const { type, payload } = data;

    switch (type) {
      case 'subscribe': {
        const { channel } = payload;
        // **Authorization Check:** Can this user subscribe to this channel?
        // Example: Only allow users to subscribe to their own notification channel.
        const userChannelPattern = `user.${ws.user.id}`;
        if (channel === userChannelPattern || channel.startsWith('public.')) {
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

      default:
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
};
