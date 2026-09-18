import fs from 'fs'; import path from 'path';
export interface DatabaseSettings { setupCompleted:boolean; primary:'upstash'|'redis'|'mysql'; upstashUrl:string; upstashToken:string; redisUrl:string; mysqlHost:string; mysqlPort:number; mysqlUser:string; mysqlPassword:string; mysqlDatabase:string; mysqlTablePrefix:string; syncEnabled:boolean; latencyEnabled:boolean; doubanDataUrls:string[]; doubanImageUrls:string[]; cdnUrls:string[] }
export const settingsPath=()=>process.env.MOONTV_SETTINGS_FILE||path.join(process.cwd(),'data','database-settings.json');
export function loadSettings():DatabaseSettings|null{try{return JSON.parse(fs.readFileSync(settingsPath(),'utf8'))}catch{return null}}
export function saveSettings(v:DatabaseSettings){fs.mkdirSync(path.dirname(settingsPath()),{recursive:true});fs.writeFileSync(settingsPath(),JSON.stringify(v,null,2),'utf8')}
export function publicSettings(v:DatabaseSettings|null){if(!v)return null;return {...v,upstashToken:v.upstashToken?'********':'',mysqlPassword:v.mysqlPassword?'********':''}}
