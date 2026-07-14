import { ConfigService } from '@nestjs/config';

export const getBullConnection = (config: ConfigService) => ({
  connection: {
    host: config.get<string>('env.redis.host'),
    port: config.get<number>('env.redis.port'),
  },
});
