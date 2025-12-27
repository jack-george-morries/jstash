import { createMMKV, type MMKV } from "react-native-mmkv";

class Storage {
  private mmkv: MMKV;

  constructor(id: string) {
    this.mmkv = createMMKV({ id });
  }

  set(key: string, value: string): void {
    this.mmkv.set(key, value);
  }

  getString(key: string): string | undefined {
    return this.mmkv.getString(key);
  }

  remove(key: string): void {
    this.mmkv.remove(key);
  }

  clearAll(): void {
    this.mmkv.clearAll();
  }
}

export const storage = new Storage("image-cache-mmkv");
