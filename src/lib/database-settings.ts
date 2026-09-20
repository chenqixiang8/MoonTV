import { Redis } from '@upstash/redis';

export interface DatabaseSettings {
  setupCompleted: boolean;
  primary: 'upstash' | 'redis' | 'mysql';
  upstashUrl: string; upstashToken: string; redisUrl: string;
  mysqlHost: string; mysqlPort: number; mysqlUser: string; mysqlPassword: string;
  mysqlDatabase: string; mysqlTablePrefix: string;
  syncEnabled: boolean; latencyEnabled: boolean;
  doubanDataUrls: string[]; doubanImageUrls: string[]; cdnUrls: string[];
  siteName: string; enableRegister: boolean; username: string; password: string;
  announcement?: string; searchDownstreamMaxPage?: number; siteInterfaceCacheTime?: number;
  doubanProxyType?: string; doubanProxy?: string;
  doubanImageProxyType?: string; doubanImageProxy?: string; disableYellowFilter?: boolean;
  storageType: 'localstorage' | 'redis' | 'upstash' | 'mysql';
}
type RemoteResponse={success:boolean;config?:DatabaseSettings|null;error?:string};
const CACHE_KEY='moontv:remote-config:encrypted:v1';
let memory:{value:DatabaseSettings|null;expires:number;source:'remote'|'upstash'}|null=null;

function bootstrap(){const url=process.env.REMOTE_CONFIG_URL;const token=process.env.REMOTE_CONFIG_TOKEN;const upstashUrl=process.env.UPSTASH_URL;const upstashToken=process.env.UPSTASH_TOKEN;if(!url||!token)throw new Error('REMOTE_CONFIG_URL 或 REMOTE_CONFIG_TOKEN 未设置');return{url,token,upstashUrl,upstashToken}}
function bytesToBase64(v:Uint8Array){return Buffer.from(v).toString('base64')}
function base64ToBytes(v:string){return new Uint8Array(Buffer.from(v,'base64'))}
async function cryptoKey(secret:string){const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function encrypt(value:DatabaseSettings,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const key=await cryptoKey(secret);const data=new TextEncoder().encode(JSON.stringify(value));const out=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('MoonTV-Upstash-Config-v1')},key,data);return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(out))}`}
async function decrypt(payload:string,secret:string){const [a,b]=payload.split('.');if(!a||!b)throw new Error('缓存格式无效');const key=await cryptoKey(secret);const out=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(a),additionalData:new TextEncoder().encode('MoonTV-Upstash-Config-v1')},key,base64ToBytes(b));return JSON.parse(new TextDecoder().decode(out)) as DatabaseSettings}
function fallbackClient(){const b=bootstrap();return b.upstashUrl&&b.upstashToken?new Redis({url:b.upstashUrl,token:b.upstashToken}):null}
let activeRuntimeSettings: DatabaseSettings | null = null;
export function applyRuntimeSettings(v: DatabaseSettings | null) { activeRuntimeSettings = v; }
export function getActiveRuntimeSettings() { return activeRuntimeSettings; }
export async function loadSettings(force=false):Promise<DatabaseSettings|null>{if(!force&&memory&&memory.expires>Date.now()){applyRuntimeSettings(memory.value);return memory.value}const b=bootstrap();try{const r=await fetch(b.url,{headers:{Authorization:`Bearer ${b.token}`,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000)});const body=await r.json().catch(()=>null) as RemoteResponse|null;if(!r.ok||!body?.success)throw new Error(body?.error||`HTTP ${r.status}`);const value=body.config||null;if(value){const c=fallbackClient();if(c)await c.set(CACHE_KEY,await encrypt(value,b.token))}memory={value,expires:Date.now()+300000,source:'remote'};applyRuntimeSettings(value);return value}catch(remoteError){const c=fallbackClient();if(!c)throw remoteError;const payload=await c.get<string>(CACHE_KEY);if(!payload)throw remoteError;const value=await decrypt(payload,b.token);memory={value,expires:Date.now()+300000,source:'upstash'};applyRuntimeSettings(value);return value}}
export async function saveSettings(v:DatabaseSettings){const b=bootstrap();const r=await fetch(b.url,{method:'POST',headers:{Authorization:`Bearer ${b.token}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(v),cache:'no-store',signal:AbortSignal.timeout(12000)});const body=await r.json().catch(()=>null) as RemoteResponse|null;if(!r.ok||!body?.success)throw new Error(body?.error||`HTTP ${r.status}`);const c=fallbackClient();if(c)await c.set(CACHE_KEY,await encrypt(v,b.token));memory={value:v,expires:Date.now()+300000,source:'remote'};applyRuntimeSettings(v)}
export function publicSettings(v:DatabaseSettings|null){if(!v)return null;return{...v,upstashToken:v.upstashToken?'********':'',redisUrl:v.redisUrl?'********':'',mysqlPassword:v.mysqlPassword?'********':'',password:v.password?'********':''}}
export function cacheStatus(){return memory?{source:memory.source,expires:memory.expires}:null}
