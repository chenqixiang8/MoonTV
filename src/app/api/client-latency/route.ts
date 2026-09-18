import { NextResponse } from 'next/server'; import { loadSettings } from '@/lib/database-settings'; export const runtime='nodejs';
export async function GET(){const s=loadSettings();return NextResponse.json({enabled:s?.latencyEnabled!==false,doubanDataUrls:s?.doubanDataUrls||[],doubanImageUrls:s?.doubanImageUrls||[],cdnUrls:s?.cdnUrls||[]});}
