import { DrawGateway } from '../socket';
import { Module } from '@nestjs/common';

@Module({
  providers: [DrawGateway],
})
export class WebSocketModule {}
