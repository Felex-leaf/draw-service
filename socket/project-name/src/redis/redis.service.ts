import { RedisIoAdapter } from '.';

enum EVENT_MAP {
  H_GET = 'hGet',
  H_DEL = 'hDel',
  DEL = 'DEL',
}

class RedisService {
  constructor() {
    Object.values(EVENT_MAP).forEach((key) => {
      this[key] = async (...arg) => {
        return await RedisIoAdapter.client[key]?.(...arg);
      };
    });
  }

  hSet = <T extends object>(key: string, object: T) => {
    const h = Object.keys(object).reduce((pre, key) => {
      const item = object[key];
      if (['string', 'number'].includes(typeof item)) {
        pre[key] = item;
      } else {
        pre[key] = JSON.stringify(item);
      }
      return pre;
    }, {} as Record<keyof T, string>);
    RedisIoAdapter.client.hSet?.(key, h);
  };
}

export const Redis: RedisService &
  Partial<Record<EVENT_MAP, (typeof RedisIoAdapter.client)[EVENT_MAP]>> =
  new RedisService();
