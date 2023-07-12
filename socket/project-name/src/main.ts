import { NestFactory } from '@nestjs/core';
import { AppModule } from './module';
import { RedisIoAdapter } from './redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);
  await app.listen(3000);
}
bootstrap();
