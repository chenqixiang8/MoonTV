/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { AdminConfig } from './admin.types';
import { RedisStorage } from './redis.db';
import { MysqlStorage } from './mysql.db';
import { ReplicatedStorage } from './replicated.db';
import { loadSettings } from './database-settings';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// 首次配置完成后优先使用 Redis，Redis 失联时回退 MySQL，仅在 Redis 与 MySQL 均失联后使用 Upstash。写操作仍同步到全部可用存储。
async function createStorage(): Promise<IStorage> {
  const cfg = await loadSettings();
  if (cfg?.setupCompleted) {
    const stores: IStorage[] = [];
    // 读取优先级由 stores 顺序决定：Redis -> MySQL -> Upstash。
    if (cfg.redisUrl) {
      process.env.REDIS_URL = cfg.redisUrl;
      stores.push(new RedisStorage());
    }
    if (cfg.mysqlHost) {
      stores.push(new MysqlStorage({
        host: cfg.mysqlHost,
        port: cfg.mysqlPort,
        user: cfg.mysqlUser,
        password: cfg.mysqlPassword,
        database: cfg.mysqlDatabase,
        tablePrefix: cfg.mysqlTablePrefix,
      }));
    }
    if (cfg.upstashUrl && cfg.upstashToken) {
      process.env.UPSTASH_URL = cfg.upstashUrl;
      process.env.UPSTASH_TOKEN = cfg.upstashToken;
      stores.push(new UpstashRedisStorage());
    }
    if (stores.length) return new ReplicatedStorage(stores) as unknown as IStorage;
  }
  const type=process.env.NEXT_PUBLIC_STORAGE_TYPE||'localstorage';
  if(type==='redis') return new RedisStorage();
  if(type==='upstash') return new UpstashRedisStorage();
  if(type==='mysql') return new MysqlStorage({host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER||'root',password:process.env.MYSQL_PASSWORD||'',database:process.env.MYSQL_DATABASE||'moontv',tablePrefix:process.env.MYSQL_TABLE_PREFIX||'moontv_'});
  return null as unknown as IStorage;
}

// 单例存储实例
let storageInstance: Promise<IStorage> | null = null;

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) storageInstance = createStorage();
  return storageInstance;
}

// 工具函数：生成存储key
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// 导出便捷方法
export class DbManager {
  private storage: IStorage;

  constructor() {
    this.storage = null as unknown as IStorage;
  }

  private async db(): Promise<IStorage> {
    if (!this.storage) this.storage = await getStorage();
    return this.storage;
  }

  // 播放记录相关方法
  async getPlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    return (await this.db()).getPlayRecord(userName, key);
  }

  async savePlayRecord(
    userName: string,
    source: string,
    id: string,
    record: PlayRecord
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await (await this.db()).setPlayRecord(userName, key, record);
  }

  async getAllPlayRecords(userName: string): Promise<{
    [key: string]: PlayRecord;
  }> {
    return (await this.db()).getAllPlayRecords(userName);
  }

  async deletePlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await (await this.db()).deletePlayRecord(userName, key);
  }

  // 收藏相关方法
  async getFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<Favorite | null> {
    const key = generateStorageKey(source, id);
    return (await this.db()).getFavorite(userName, key);
  }

  async saveFavorite(
    userName: string,
    source: string,
    id: string,
    favorite: Favorite
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await (await this.db()).setFavorite(userName, key, favorite);
  }

  async getAllFavorites(
    userName: string
  ): Promise<{ [key: string]: Favorite }> {
    return (await this.db()).getAllFavorites(userName);
  }

  async deleteFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    await (await this.db()).deleteFavorite(userName, key);
  }

  async isFavorited(
    userName: string,
    source: string,
    id: string
  ): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  // ---------- 用户相关 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    await (await this.db()).registerUser(userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return (await this.db()).verifyUser(userName, password);
  }

  // 检查用户是否已存在
  async checkUserExist(userName: string): Promise<boolean> {
    return (await this.db()).checkUserExist(userName);
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    return (await this.db()).getSearchHistory(userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await (await this.db()).addSearchHistory(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await (await this.db()).deleteSearchHistory(userName, keyword);
  }

  // 获取全部用户名
  async getAllUsers(): Promise<string[]> {
    if (typeof (this.storage as any).getAllUsers === 'function') {
      return (this.storage as any).getAllUsers();
    }
    return [];
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    if (typeof (this.storage as any).getAdminConfig === 'function') {
      return (this.storage as any).getAdminConfig();
    }
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    if (typeof (this.storage as any).setAdminConfig === 'function') {
      await (this.storage as any).setAdminConfig(config);
    }
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<SkipConfig | null> {
    if (typeof (this.storage as any).getSkipConfig === 'function') {
      return (this.storage as any).getSkipConfig(userName, source, id);
    }
    return null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig
  ): Promise<void> {
    if (typeof (this.storage as any).setSkipConfig === 'function') {
      await (this.storage as any).setSkipConfig(userName, source, id, config);
    }
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    if (typeof (this.storage as any).deleteSkipConfig === 'function') {
      await (this.storage as any).deleteSkipConfig(userName, source, id);
    }
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: SkipConfig }> {
    if (typeof (this.storage as any).getAllSkipConfigs === 'function') {
      return (this.storage as any).getAllSkipConfigs(userName);
    }
    return {};
  }
}

// 导出默认实例
export const db = new DbManager();
