import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RolesGuard } from 'src/guard';
import { Redis } from 'src/redis';
import { parse } from 'src/utils';
import { DRAW_EVENT } from './consts';

const { hGet, hSet, DEL, hDel } = Redis;

const { ACTION, REQUEST_IMG, JOIN_ROOM, LEAVE_ROOM, EMIT_IMG } = DRAW_EVENT;

export interface DrawSocketStatus {
  status?: string;
  penSize?: number;
  room?: string;
  color?: string;
  type?: string;
  data?: string;
  id?: string;
  x?: number;
  y?: number;
  mX?: number;
  mY?: number;
}

const handleUserIds = async (room: string, id: string, isAdd = true) => {
  console.log(room, id, isAdd);
  const ids = parse<string[]>((await hGet(room, 'userIds')) as string, []);
  if (isAdd) {
    console.log(ids);
    hSet?.(room, {
      room,
      userIds: [...new Set([...ids, id])],
    });
  } else {
    const newIds = ids.filter((userId) => id !== userId);
    hSet?.(room, {
      room,
      userIds: newIds,
    });
  }
};

@WebSocketGateway(4000, {
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
})
export class DrawGateway {
  // 直接访问原生的、特定于平台的服务器实例
  @WebSocketServer()
  server: Server;

  // 断开链接
  @SubscribeMessage('disconnect')
  async handleDisconnect(client: Socket) {
    const room = await hGet(client.id, 'room');
    console.log(room);
    if (room) handleUserIds(room as string, client.id, false);
    DEL(client.id);
  }

  // 画笔操作
  @SubscribeMessage(ACTION)
  public penAction(client: Socket, data): void {
    const { room } = parse<DrawSocketStatus>(data);
    console.log(room);

    this.server.to(room).emit(ACTION, data);
  }

  // 请求页面图片
  @UseGuards(RolesGuard)
  @SubscribeMessage(REQUEST_IMG)
  public async requestImg(client: Socket, data) {
    const { room, id } = parse<DrawSocketStatus>(data);
    const userIds = (await hGet(room, 'userIds')) as string;
    const socketId = parse<string[]>(userIds, []).find(
      (userId) => userId !== id && this.server.sockets.sockets.has(userId),
    );
    console.log(room, 'room');
    console.log(id, 'id');
    console.log(socketId, 'socketId');
    console.log(userIds, 'userIds');
    console.log(this.server.sockets.sockets.keys(), 'keys');
    if (socketId)
      this.server.sockets.sockets.get(socketId).emit(REQUEST_IMG, data);
  }

  // 发送页面图片
  @SubscribeMessage(EMIT_IMG)
  public emitImg(client: Socket, data): void {
    const { id } = parse<DrawSocketStatus>(data);
    const c = this.server.sockets.sockets.get(id);
    if (!c) return;
    c.emit(EMIT_IMG, data);
  }

  // 某人加入某Room
  @SubscribeMessage(JOIN_ROOM)
  public async joinRoom(client: Socket, data: any) {
    const { room } = parse<DrawSocketStatus>(data);
    client.join(room);
    hSet(client.id, { room });
    await handleUserIds(room, client.id);
    this.server.emit(JOIN_ROOM, room);
  }

  // 某人离开某Room
  @SubscribeMessage(LEAVE_ROOM)
  public async leaveRoom(client: Socket, data: any) {
    const { room } = parse<DrawSocketStatus>(data);
    client.leave(room);
    hDel(client.id, 'room');
    await handleUserIds(room, client.id, false);
    this.server.emit(LEAVE_ROOM, data);
  }
}
