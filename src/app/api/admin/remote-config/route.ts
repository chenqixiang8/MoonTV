import { NextRequest,NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { cacheStatus,loadSettings } from '@/lib/database-settings';
export const runtime='nodejs';
export async function POST(request:NextRequest){const auth=getAuthInfoFromCookie(request);if(!auth?.username)return NextResponse.json({error:'Unauthorized'},{status:401});try{const value=await loadSettings(true);if(!value)throw new Error('远程配置为空');return NextResponse.json({ok:true,source:cacheStatus()?.source||'remote',updatedAt:new Date().toISOString()})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'更新失败'},{status:502})}}
