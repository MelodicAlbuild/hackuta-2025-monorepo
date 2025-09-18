const amqp = require('amqplib');
const config = require('../config');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.ready = false;
  }

  async connect(onMessageCallback) {
    try {
      this.connection = await amqp.connect(config.rabbitMQ.url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err) => {
        console.error('[AMQP] connection error', err.message);
        setTimeout(() => this.connect(onMessageCallback), 5000);
      });

      console.log('[AMQP] Connected');
      this.ready = true;

      await this.channel.assertExchange(
        config.rabbitMQ.exchangeName,
        config.rabbitMQ.exchangeType,
        { durable: false },
      );
      const q = await this.channel.assertQueue('', { exclusive: true });

      // Listen for all topics
      await this.channel.bindQueue(q.queue, config.rabbitMQ.exchangeName, '#');

      this.channel.consume(q.queue, (msg) => onMessageCallback(msg), {
        noAck: true,
      });
    } catch (error) {
      console.error('[AMQP] Failed to connect, retrying...', error.message);
      this.ready = false;
      setTimeout(() => this.connect(onMessageCallback), 5000);
    }
  }

  isReady() {
    return !!this.ready && !!this.connection && !!this.channel;
  }
}

module.exports = new RabbitMQService();
