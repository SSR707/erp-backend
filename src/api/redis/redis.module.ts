// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { config } from 'src/config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = new Redis({
          host: config.REDIS_HOST,
          port: +config.REDIS_PORT,
        });
        client.on('connect', () => {
          console.log('connect to redis ✅');
        });
        client.on('error', (err) => {
          console.error('Error redis ❌', err);
        });
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
