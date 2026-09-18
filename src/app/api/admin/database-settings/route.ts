import { NextRequest,NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { DatabaseSettings,loadSettings,publicSettings,saveSettings } from '@/lib/database-settings';
import { MysqlStorage } from '@/lib/mysql.db';
export const runtime='nodejs';
function guard(r:NextRequest){return Boolean(getAuthInfoFromCookie(r)?.username)}
export async function GET(r:NextRequest){if(!guard(r))return NextResponse.json({error:'Unauthorized'},{status:401});const s=loadSettings();return NextResponse.json({setupRequired:!s?.setupCompleted,settings:publicSettings(s)});}
export async function POST(r:NextRequest){if(!guard(r))return NextResponse.json({error:'Unauthorized'},{status:401});try{const v=await r.json() as DatabaseSettings;if(!v.redisUrl||!v.mysqlHost||!v.mysqlDatabase)throw new Error('Redis 与 MySQL 地址、数据库名不能为空');const mysql=new MysqlStorage({host:v.mysqlHost,port:Number(v.mysqlPort||3306),user:v.mysqlUser,password:v.mysqlPassword,database:v.mysqlDatabase,tablePrefix:v.mysqlTablePrefix});await mysql.ping();const {createClient}=await import('redis');const redis=createClient({url:v.redisUrl});await redis.connect();await redis.ping();await redis.quit();saveSettings({...v,setupCompleted:true});return NextResponse.json({ok:true,message:'连接测试、MySQL 建表和首次配置已完成'});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'设置失败'},{status:400})}}
