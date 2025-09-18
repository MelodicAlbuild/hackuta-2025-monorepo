require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8090,
  rabbitMQ: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchangeName: 'app_events_topic',
    exchangeType: 'topic',
  },
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || '', // For auth
};
