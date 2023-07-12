import { Module } from '@nestjs/common';
import { AppController } from '../controller';
import { AppService } from '../service';

import { WebSocketModule } from './socket';

@Module({
  imports: [WebSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
