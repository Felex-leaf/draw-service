export function parse<T extends object>(d: string, defaultData = {}) {
  let data: T;
  try {
    data = JSON.parse(d) || defaultData;
  } catch {
    data = defaultData as T;
  }
  return data;
}
