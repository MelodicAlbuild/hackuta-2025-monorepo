class SubscriptionManager {
  constructor() {
    // Map<channelName, Set<WebSocket>>
    this.subscriptions = new Map();
    // Map<WebSocket, Set<channelName>>
    this.clientSubscriptions = new Map();
  }

  subscribe(client, channel) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    if (!this.clientSubscriptions.has(client)) {
      this.clientSubscriptions.set(client, new Set());
    }
    this.subscriptions.get(channel).add(client);
    this.clientSubscriptions.get(client).add(channel);
    console.log(`Client subscribed to ${channel}`);
  }

  unsubscribe(client, channel) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(client);
    }
    if (this.clientSubscriptions.has(client)) {
      this.clientSubscriptions.get(client).delete(channel);
    }
    console.log(`Client unsubscribed from ${channel}`);
  }

  getSubscribersForChannel(channel) {
    return this.subscriptions.get(channel) || new Set();
  }

  // Clean up all subscriptions for a disconnected client
  cleanup(client) {
    if (this.clientSubscriptions.has(client)) {
      const channels = this.clientSubscriptions.get(client);
      channels.forEach((channel) => {
        this.unsubscribe(client, channel);
      });
      this.clientSubscriptions.delete(client);
      console.log('Cleaned up client subscriptions.');
    }
  }
}

module.exports = new SubscriptionManager();
