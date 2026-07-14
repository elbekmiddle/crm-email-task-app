import { registerAs } from '@nestjs/config';

export default registerAs('env', () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  mongodbUri: process.env.MONGODB_URI,
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  },
  
  webhookSecret: process.env.WEBHOOK_SECRET,
}));
