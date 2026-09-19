export interface DatabaseSettings {
  setupCompleted: boolean;
  primary: 'upstash' | 'redis' | 'mysql';
  upstashUrl: string;
  upstashToken: string;
  redisUrl: string;
  mysqlHost: string;
  mysqlPort: number;
  mysqlUser: string;
  mysqlPassword: string;
  mysqlDatabase: string;
  mysqlTablePrefix: string;
  syncEnabled: boolean;
  latencyEnabled: boolean;
  doubanDataUrls: string[];
  doubanImageUrls: string[];
  cdnUrls: string[];
}

type RemoteResponse = { success: boolean; config?: DatabaseSettings; error?: string };
let cache: { value: DatabaseSettings | null; expires: number } | null = null;

function remoteConfig() {
  const url = process.env.REMOTE_CONFIG_URL;
  const token = process.env.REMOTE_CONFIG_TOKEN;
  if (!url || !token) throw new Error('REMOTE_CONFIG_URL 或 REMOTE_CONFIG_TOKEN 未设置');
  return { url, token };
}

export async function loadSettings(force = false): Promise<DatabaseSettings | null> {
  if (!force && cache && cache.expires > Date.now()) return cache.value;
  const { url, token } = remoteConfig();
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  const body = (await response.json().catch(() => null)) as RemoteResponse | null;
  if (!response.ok || !body?.success) throw new Error(body?.error || `远程配置读取失败: HTTP ${response.status}`);
  const value = body.config || null;
  cache = { value, expires: Date.now() + 30000 };
  return value;
}

export async function saveSettings(value: DatabaseSettings): Promise<void> {
  const { url, token } = remoteConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  const body = (await response.json().catch(() => null)) as RemoteResponse | null;
  if (!response.ok || !body?.success) throw new Error(body?.error || `远程配置保存失败: HTTP ${response.status}`);
  cache = { value, expires: Date.now() + 30000 };
}

export function publicSettings(value: DatabaseSettings | null) {
  if (!value) return null;
  return { ...value, upstashToken: value.upstashToken ? '********' : '', mysqlPassword: value.mysqlPassword ? '********' : '', redisUrl: value.redisUrl ? '********' : '' };
}
