/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql, { Pool } from 'mysql2/promise';
import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
export interface MysqlOptions { host:string; port:number; user:string; password:string; database:string; tablePrefix:string }
export class MysqlStorage implements IStorage {
 private pool:Pool; private table:string; private ready?:Promise<void>;
 constructor(o:MysqlOptions){this.table=(o.tablePrefix||'moontv_').replace(/[^a-zA-Z0-9_]/g,'')+'kv';this.pool=mysql.createPool({host:o.host,port:o.port,user:o.user,password:o.password,database:o.database,waitForConnections:true,connectionLimit:10,enableKeepAlive:true});}
 init(){return this.ready||(this.ready=this.pool.query(`CREATE TABLE IF NOT EXISTS \`${this.table}\` (\`k\` VARCHAR(512) NOT NULL PRIMARY KEY,\`v\` LONGTEXT NOT NULL,\`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).then(()=>undefined));}
 async ping(){await this.init();await this.pool.query('SELECT 1');}
 private async get<T>(k:string):Promise<T|null>{await this.init();const [rows]=await this.pool.query<any[]>(`SELECT v FROM \`${this.table}\` WHERE k=? LIMIT 1`,[k]);return rows[0]?JSON.parse(rows[0].v):null;}
 private async set(k:string,v:any){await this.init();await this.pool.query(`INSERT INTO \`${this.table}\`(k,v) VALUES(?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)`,[k,JSON.stringify(v)]);}
 private async del(k:string){await this.init();await this.pool.query(`DELETE FROM \`${this.table}\` WHERE k=?`,[k]);}
 private async all<T>(prefix:string){await this.init();const [rows]=await this.pool.query<any[]>(`SELECT k,v FROM \`${this.table}\` WHERE k LIKE ?`,[prefix+'%']);return Object.fromEntries(rows.map(x=>[x.k.slice(prefix.length),JSON.parse(x.v)])) as Record<string,T>;}
 getPlayRecord(u:string,k:string){return this.get<PlayRecord>(`u:${u}:pr:${k}`)} setPlayRecord(u:string,k:string,v:PlayRecord){return this.set(`u:${u}:pr:${k}`,v)} getAllPlayRecords(u:string){return this.all<PlayRecord>(`u:${u}:pr:`)} deletePlayRecord(u:string,k:string){return this.del(`u:${u}:pr:${k}`)}
 getFavorite(u:string,k:string){return this.get<Favorite>(`u:${u}:fav:${k}`)} setFavorite(u:string,k:string,v:Favorite){return this.set(`u:${u}:fav:${k}`,v)} getAllFavorites(u:string){return this.all<Favorite>(`u:${u}:fav:`)} deleteFavorite(u:string,k:string){return this.del(`u:${u}:fav:${k}`)}
 async registerUser(u:string,p:string){if(await this.checkUserExist(u))throw new Error('用户已存在');await this.set(`u:${u}:pwd`,p)} async verifyUser(u:string,p:string){return (await this.get<string>(`u:${u}:pwd`))===p} async checkUserExist(u:string){return (await this.get(`u:${u}:pwd`))!==null} changePassword(u:string,p:string){return this.set(`u:${u}:pwd`,p)} async deleteUser(u:string){await this.init();await this.pool.query(`DELETE FROM \`${this.table}\` WHERE k LIKE ?`,[`u:${u}:%`]);}
 async getSearchHistory(u:string){return (await this.get<string[]>(`u:${u}:search`))||[]} async addSearchHistory(u:string,k:string){const a=await this.getSearchHistory(u);await this.set(`u:${u}:search`,[k,...a.filter(x=>x!==k)].slice(0,20))} async deleteSearchHistory(u:string,k?:string){if(!k){await this.del(`u:${u}:search`);return}await this.set(`u:${u}:search`,(await this.getSearchHistory(u)).filter(x=>x!==k))}
 async getAllUsers(){await this.init();const [rows]=await this.pool.query<any[]>(`SELECT k FROM \`${this.table}\` WHERE k LIKE 'u:%:pwd'`);return rows.map(x=>x.k.substring(2,x.k.length-4));}
 getAdminConfig(){return this.get<AdminConfig>('config:admin')} setAdminConfig(v:AdminConfig){return this.set('config:admin',v)}
 getSkipConfig(u:string,s:string,i:string){return this.get<SkipConfig>(`u:${u}:skip:${s}+${i}`)} setSkipConfig(u:string,s:string,i:string,v:SkipConfig){return this.set(`u:${u}:skip:${s}+${i}`,v)} deleteSkipConfig(u:string,s:string,i:string){return this.del(`u:${u}:skip:${s}+${i}`)} getAllSkipConfigs(u:string){return this.all<SkipConfig>(`u:${u}:skip:`)}
}
