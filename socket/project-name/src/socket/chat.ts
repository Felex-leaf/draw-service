import { Socket } from '@nestjs/platform-socket.io/node_modules/socket.io';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(4000, {
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  // 直接访问原生的、特定于平台的服务器实例
  @WebSocketServer()
  server: Server;
  // 向Room 推消息
  @SubscribeMessage('msgToServer')
  public handleMessage(client: Socket, payload: any) {
    return this.server.to(payload.room).emit('msgToClient', payload);
  }

  // 某人加入某Room
  @SubscribeMessage('joinRoom')
  public joinRoom(client: Socket, room: any): void {
    client.join(room.room);
    client.emit('joinedRoom', room);
  }

  // 某人离开某Room
  @SubscribeMessage('leaveRoom')
  public leaveRoom(client: Socket, room: any): void {
    client.leave(room.room);
    client.emit('leftRoom', room);
  }
}
